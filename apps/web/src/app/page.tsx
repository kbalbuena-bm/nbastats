'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface NBAPlayer {
  id: string
  name: string
  team: string
  teamId: string
  position: string
  age: number
  gamesPlayed: number
  points: number
  rebounds: number
  assists: number
  imageUrl: string
  // Stock market calculations
  stockPrice?: number
  priceChange?: number
  percentChange?: number
  volume?: number
}

type SortField = 'name' | 'stockPrice' | 'percentChange' | 'points' | 'gamesPlayed'
type SortOrder = 'asc' | 'desc'

export default function HomePage() {
  const router = useRouter()
  const { user, signOut, loading: authLoading } = useAuth()
  
  const [players, setPlayers] = useState<NBAPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedPosition, setSelectedPosition] = useState<string>('all')
  const [minGamesPlayed, setMinGamesPlayed] = useState<number>(0)
  
  const [sortField, setSortField] = useState<SortField>('stockPrice')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [addingFavorite, setAddingFavorite] = useState<string | null>(null)

  // Calculate "stock price" based on player performance
  const calculateStockMetrics = (player: any) => {
    // Stock Price Formula: (PPG * 10) + (APG * 5) + (RPG * 3) + (GP * 0.5)
    const stockPrice = (player.points * 10) + (player.assists * 5) + (player.rebounds * 3) + (player.gamesPlayed * 0.5)
    
    // Simulate price change (in reality, you'd compare to last season or last week)
    const priceChange = (Math.random() * 40) - 15 // Random between -15 and +25
    const percentChange = stockPrice > 0 ? (priceChange / stockPrice) * 100 : 0
    
    // Volume = games played * 10000 (simulate trading volume)
    const volume = player.gamesPlayed * 10000
    
    return {
      ...player,
      stockPrice: parseFloat(stockPrice.toFixed(2)),
      priceChange: parseFloat(priceChange.toFixed(2)),
      percentChange: parseFloat(percentChange.toFixed(2)),
      volume
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  useEffect(() => {
    if (user) {
      fetchFavorites()
    } else {
      setFavorites(new Set())
    }
  }, [user])

  const fetchFavorites = async () => {
    try {
      const { data } = await supabase
        .from('favorite_players')
        .select('player_id')

      if (data) {
        setFavorites(new Set(data.map(fav => fav.player_id)))
      }
    } catch (err) {
      console.error('Error fetching favorites:', err)
    }
  }

  const toggleFavorite = async (player: NBAPlayer) => {
    if (!user) {
      router.push('/login')
      return
    }

    setAddingFavorite(player.id)

    try {
      if (favorites.has(player.id)) {
        const { error } = await supabase
          .from('favorite_players')
          .delete()
          .eq('player_id', player.id)

        if (error) throw error

        const newFavorites = new Set(favorites)
        newFavorites.delete(player.id)
        setFavorites(newFavorites)
      } else {
        const { error } = await supabase
          .from('favorite_players')
          .insert({
            user_id: user.id,
            player_id: player.id,
            player_name: player.name,
            team: player.team
          })

        if (error) throw error

        const newFavorites = new Set(favorites)
        newFavorites.add(player.id)
        setFavorites(newFavorites)
      }
    } catch (err) {
      console.error('Error toggling favorite:', err)
      alert('Failed to update portfolio. Please try again.')
    } finally {
      setAddingFavorite(null)
    }
  }

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      setLoading(true)
      setError('')
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/players/all`)
      const data = await response.json()
      
      if (data.success && data.data && data.indices) {
        const { indices } = data
        
        const transformedPlayers = data.data
          .map((player: any[]) => ({
            id: player[indices.playerId],
            name: player[indices.playerName],
            team: player[indices.teamAbbrev] || 'N/A',
            teamId: player[indices.teamId],
            position: player[indices.position] || 'N/A',
            age: player[indices.age] || 0,
            gamesPlayed: player[indices.gamesPlayed] || 0,
            points: player[indices.points] || 0,
            rebounds: player[indices.rebounds] || 0,
            assists: player[indices.assists] || 0,
            imageUrl: `https://cdn.nba.com/headshots/nba/latest/1040x760/${player[indices.playerId]}.png`
          }))
          .filter((p: NBAPlayer) => p.gamesPlayed > 0)
          .map(calculateStockMetrics)
        
        setPlayers(transformedPlayers)
      }
      
      setLoading(false)
    } catch (err) {
      console.error('Error fetching players:', err)
      setError('Failed to connect to market data. Make sure the API is running.')
      setLoading(false)
    }
  }

  const uniqueTeams = Array.from(new Set(players.map(p => p.team))).sort()
  const uniquePositions = Array.from(new Set(players.map(p => p.position))).sort()

  const filteredAndSortedPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTeam = selectedTeam === 'all' || player.team === selectedTeam
      const matchesPosition = selectedPosition === 'all' || player.position === selectedPosition
      const matchesGamesPlayed = player.gamesPlayed >= minGamesPlayed
      
      return matchesSearch && matchesTeam && matchesPosition && matchesGamesPlayed
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'stockPrice':
          comparison = (a.stockPrice || 0) - (b.stockPrice || 0)
          break
        case 'percentChange':
          comparison = (a.percentChange || 0) - (b.percentChange || 0)
          break
        case 'points':
          comparison = a.points - b.points
          break
        case 'gamesPlayed':
          comparison = a.gamesPlayed - b.gamesPlayed
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Get top gainers and losers
  const topGainers = [...players].sort((a, b) => (b.percentChange || 0) - (a.percentChange || 0)).slice(0, 5)
  const topLosers = [...players].sort((a, b) => (a.percentChange || 0) - (b.percentChange || 0)).slice(0, 5)

  // Calculate market index (average of top 100 players)
  const marketIndex = players.length > 0 
    ? players.slice(0, 100).reduce((sum, p) => sum + (p.stockPrice || 0), 0) / Math.min(players.length, 100)
    : 0

  const avgPercentChange = players.length > 0
    ? players.reduce((sum, p) => sum + (p.percentChange || 0), 0) / players.length
    : 0

  return (
    <main className="min-h-screen bg-background-dark">
      
      {/* LIVE TICKER TAPE */}
      <div className="ticker-wrap">
        <div className="ticker-content text-xs font-bold tracking-wider">
          {topGainers.map((player, i) => (
            <span key={i} className="flex items-center gap-2 uppercase">
              {player.name.split(' ').pop()} 
              <span className={player.percentChange && player.percentChange >= 0 ? 'text-primary' : 'text-market-red'}>
                ${player.stockPrice?.toFixed(2)} ({player.percentChange && player.percentChange >= 0 ? '+' : ''}{player.percentChange?.toFixed(1)}%)
              </span>
            </span>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-20 lg:px-40 py-5">
        <div className="max-w-[1400px] mx-auto">
          
          {/* HEADER */}
          <header className="flex items-center justify-between border-b border-border-dark px-4 py-3 mb-6">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="text-primary text-4xl">📈</div>
                <h2 className="text-white text-xl font-bold leading-tight tracking-tight">HOOPMARKET</h2>
              </div>
              
              {/* Search */}
              <label className="hidden md:flex flex-col min-w-40 h-10 max-w-64">
                <div className="flex w-full items-stretch rounded-lg h-full">
                  <div className="text-text-muted flex border-none bg-border-dark items-center justify-center pl-4 rounded-l-lg">
                    <span>🔍</span>
                  </div>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex w-full min-w-0 flex-1 rounded-lg text-white focus:outline-0 focus:ring-0 border-none bg-border-dark h-full placeholder:text-text-muted px-4 rounded-l-none text-sm font-normal"
                    placeholder="Search Players or Teams"
                  />
                </div>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-6">
                <button onClick={() => router.push('/')} className="text-primary text-sm font-bold border-b-2 border-primary pb-1">Dashboard</button>
                {user && <button onClick={() => router.push('/favorites')} className="text-text-muted hover:text-white text-sm font-medium transition-colors">Portfolio</button>}
                <button onClick={() => router.push('/teams')} className="text-text-muted hover:text-white text-sm font-medium transition-colors">Teams</button>
                <button onClick={() => router.push('/compare')} className="text-text-muted hover:text-white text-sm font-medium transition-colors">Screener</button>
              </div>
              
              <div className="flex gap-2">
                {!authLoading && (
                  <>
                    {user ? (
                      <>
                        <button
                          onClick={() => router.push('/favorites')}
                          className="hidden md:flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold hover:bg-primary/80 transition-all"
                        >
                          My Portfolio
                        </button>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center justify-center rounded-lg h-10 px-4 bg-border-dark text-white hover:bg-border-dark/80 transition-all"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => router.push('/login')}
                          className="flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-background-dark text-sm font-bold hover:bg-primary/80 transition-all"
                        >
                          Login
                        </button>
                        <button
                          onClick={() => router.push('/signup')}
                          className="hidden md:flex items-center justify-center rounded-lg h-10 px-4 bg-border-dark text-white hover:bg-border-dark/80 transition-all"
                        >
                          Sign Up
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </header>

          {/* MARKET SUMMARY */}
          {!loading && !error && (
            <div className="flex flex-wrap gap-4 px-4 pb-6">
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-border-dark bg-card-dark/30 market-card">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">NBA 100 Index</p>
                <p className="text-white tracking-light text-2xl font-bold leading-tight">${marketIndex.toFixed(2)}</p>
                <p className={`text-sm font-medium ${avgPercentChange >= 0 ? 'text-primary' : 'text-market-red'}`}>
                  {avgPercentChange >= 0 ? '+' : ''}{avgPercentChange.toFixed(2)}% <span className="text-text-muted font-normal">Today</span>
                </p>
              </div>
              
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-border-dark bg-card-dark/30 market-card">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">Total Players</p>
                <p className="text-white tracking-light text-2xl font-bold leading-tight">{players.length}</p>
                <p className="text-primary text-sm font-medium">Active <span className="text-text-muted font-normal">This Season</span></p>
              </div>
              
              <div className="flex min-w-[158px] flex-1 flex-col gap-2 rounded-xl p-6 border border-border-dark bg-card-dark/30 market-card">
                <p className="text-text-muted text-xs font-semibold uppercase tracking-widest">Market Sentiment</p>
                <p className="text-white tracking-light text-2xl font-bold leading-tight">{avgPercentChange >= 0 ? 'Bullish' : 'Bearish'}</p>
                <p className="text-primary text-sm font-medium">{Math.abs(avgPercentChange).toFixed(1)}% <span className="text-text-muted font-normal">Confidence</span></p>
              </div>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="text-center py-20">
              <div className="relative inline-block">
                <div className="animate-spin rounded-full h-24 w-24 border-b-8 border-primary mx-auto glow-green"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl">📊</span>
                </div>
              </div>
              <p className="text-primary mt-6 font-black text-xl">LOADING MARKET DATA...</p>
              <p className="text-text-muted text-sm mt-2 font-semibold">Fetching player stocks</p>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-market-red/20 border-2 border-market-red rounded-2xl p-8 mb-4">
              <div className="flex items-start gap-4">
                <span className="text-market-red text-4xl">⚠️</span>
                <div className="flex-1">
                  <p className="text-white font-black text-xl mb-2">{error}</p>
                  <button
                    onClick={fetchPlayers}
                    className="mt-6 px-6 py-3 bg-primary text-background-dark font-black rounded-lg hover:bg-primary/80 transition-all"
                  >
                    🔄 RECONNECT TO MARKET
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MAIN CONTENT */}
          {!loading && !error && (
            <>
              {/* GAINERS & LOSERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 mb-6">
                {/* Gainers */}
                <div className="rounded-xl border border-border-dark bg-card-dark/10 p-4">
                  <h3 className="text-primary text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    📈 Market Gainers
                  </h3>
                  <div className="flex flex-col gap-3">
                    {topGainers.slice(0, 3).map((player) => (
                      <div
                        key={player.id}
                        onClick={() => router.push(`/player/${player.id}`)}
                        className="flex items-center justify-between p-2 hover:bg-border-dark/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={player.imageUrl}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-800"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          <div>
                            <p className="text-sm font-bold">{player.name.split(' ').pop()}</p>
                            <p className="text-xs text-text-muted">{player.team} • ${player.stockPrice?.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-primary font-bold text-sm">+{player.percentChange?.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Losers */}
                <div className="rounded-xl border border-border-dark bg-card-dark/10 p-4">
                  <h3 className="text-market-red text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                    📉 Market Losers
                  </h3>
                  <div className="flex flex-col gap-3">
                    {topLosers.slice(0, 3).map((player) => (
                      <div
                        key={player.id}
                        onClick={() => router.push(`/player/${player.id}`)}
                        className="flex items-center justify-between p-2 hover:bg-border-dark/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={player.imageUrl}
                            alt={player.name}
                            className="w-10 h-10 rounded-full object-cover bg-gray-800"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                          <div>
                            <p className="text-sm font-bold">{player.name.split(' ').pop()}</p>
                            <p className="text-xs text-text-muted">{player.team} • ${player.stockPrice?.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-market-red font-bold text-sm">{player.percentChange?.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* FILTERS */}
              <div className="bg-card-dark/20 border border-border-dark rounded-xl p-6 mb-6 mx-4">
                <h3 className="font-black text-primary mb-4 flex items-center gap-2 text-lg">
                  <span>🎯</span> MARKET FILTERS
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Team</label>
                    <select
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                    >
                      <option value="all">All Teams</option>
                      {uniqueTeams.map(team => (
                        <option key={team} value={team}>{team}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Position</label>
                    <select
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                    >
                      <option value="all">All Positions</option>
                      {uniquePositions.map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Min Games</label>
                    <select
                      value={minGamesPlayed}
                      onChange={(e) => setMinGamesPlayed(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                    >
                      <option value="0">All</option>
                      <option value="10">10+</option>
                      <option value="20">20+</option>
                      <option value="40">40+</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">Sort By</label>
                    <div className="flex gap-2">
                      <select
                        value={sortField}
                        onChange={(e) => setSortField(e.target.value as SortField)}
                        className="flex-1 px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                      >
                        <option value="stockPrice">Stock Price</option>
                        <option value="percentChange">% Change</option>
                        <option value="points">Points</option>
                        <option value="gamesPlayed">Games</option>
                        <option value="name">Name</option>
                      </select>
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="px-4 py-3 bg-primary hover:bg-primary/80 text-background-dark font-black rounded-lg transition-all"
                      >
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6 pt-4 border-t border-border-dark">
                  <p className="text-sm text-text-muted font-semibold">
                    Showing <span className="text-primary font-black text-lg">{filteredAndSortedPlayers.length}</span> of <span className="text-white font-bold">{players.length}</span> stocks
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedTeam('all')
                      setSelectedPosition('all')
                      setMinGamesPlayed(0)
                      setSortField('stockPrice')
                      setSortOrder('desc')
                    }}
                    className="px-4 py-2 bg-market-red hover:bg-market-red/80 text-white font-bold rounded-lg transition-all"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>

              {/* PLAYER STOCKS GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-4 max-h-[1000px] overflow-y-auto scrollbar-hide">
                {filteredAndSortedPlayers.slice(0, 100).map((player) => (
                  <div
                    key={player.id}
                    className="bg-card-dark border border-border-dark rounded-xl overflow-hidden hover:border-primary hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer market-card relative"
                    onClick={() => router.push(`/player/${player.id}`)}
                  >
                    {/* Portfolio Star */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(player)
                      }}
                      disabled={addingFavorite === player.id}
                      className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-lg transition-all ${
                        favorites.has(player.id)
                          ? 'bg-primary text-background-dark'
                          : 'bg-background-dark/80 text-text-muted hover:bg-primary hover:text-background-dark'
                      }`}
                    >
                      {addingFavorite === player.id ? '...' : favorites.has(player.id) ? '★' : '☆'}
                    </button>

                    <div className="relative h-40 bg-gradient-to-br from-border-dark to-background-dark overflow-hidden">
                      <img
                        src={player.imageUrl}
                        alt={player.name}
                        className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                      <div className="absolute bottom-3 left-3 bg-background-dark/90 border border-primary text-primary text-xs font-black px-3 py-1 rounded-full">
                        {player.team}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-background-dark/90 border border-border-dark text-text-muted text-xs font-black px-3 py-1 rounded-full">
                        {player.position}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-card-dark">
                      <h3 className="font-black text-white text-sm mb-2 truncate">{player.name}</h3>
                      
                      {/* Stock Price */}
                      <div className="mb-3">
                        <div className="flex items-end gap-2">
                          <span className="text-2xl font-black text-primary">${player.stockPrice?.toFixed(2)}</span>
                          <span className={`text-sm font-bold ${player.percentChange && player.percentChange >= 0 ? 'text-primary' : 'text-market-red'}`}>
                            {player.percentChange && player.percentChange >= 0 ? '+' : ''}{player.percentChange?.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">Vol: {(player.volume || 0).toLocaleString()}</p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-background-dark rounded px-2 py-1">
                          <div className="font-bold text-white">{player.points.toFixed(1)}</div>
                          <div className="text-text-muted">PPG</div>
                        </div>
                        <div className="bg-background-dark rounded px-2 py-1">
                          <div className="font-bold text-white">{player.rebounds.toFixed(1)}</div>
                          <div className="text-text-muted">RPG</div>
                        </div>
                        <div className="bg-background-dark rounded px-2 py-1">
                          <div className="font-bold text-white">{player.assists.toFixed(1)}</div>
                          <div className="text-text-muted">APG</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* NO RESULTS */}
              {filteredAndSortedPlayers.length === 0 && (
                <div className="text-center py-20">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-2xl font-black text-primary mb-2">NO STOCKS FOUND</p>
                  <p className="text-sm text-text-muted mb-6 font-semibold">Try adjusting your filters</p>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedTeam('all')
                      setSelectedPosition('all')
                      setMinGamesPlayed(0)
                    }}
                    className="px-8 py-4 bg-primary text-background-dark font-black rounded-xl hover:bg-primary/80 transition-all"
                  >
                    🔄 RESET FILTERS
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* FOOTER */}
      <footer className="mt-12 border-t border-border-dark py-8 text-center text-text-muted text-xs">
        <p className="mb-4 uppercase tracking-widest">Market data is calculated based on real-time NBA statistics.</p>
        <div className="flex justify-center gap-8">
          <button onClick={() => router.push('/games')} className="hover:text-primary transition-colors">Live Games</button>
          <button onClick={() => router.push('/teams')} className="hover:text-primary transition-colors">Teams</button>
          <button onClick={() => router.push('/compare')} className="hover:text-primary transition-colors">Compare</button>
        </div>
      </footer>
    </main>
  )
}
