'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic'

interface Player {
  id: string
  name: string
  team: string
  position: string
  ppg: number
  rpg: number
  apg: number
}

interface PlayerComparison {
  id: string
  name: string
  team: string
  position: string
  age: number
  height: string
  weight: string
  stats: {
    ppg: number
    rpg: number
    apg: number
    fgPct: number
    fg3Pct: number
    ftPct: number
    gp: number
    min: number
  }
  careerStats: {
    seasons: number
    totalPoints: number
    totalRebounds: number
    totalAssists: number
  }
}

function ComparePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [player1Id, setPlayer1Id] = useState<string>(searchParams.get('p1') || '')
  const [player2Id, setPlayer2Id] = useState<string>(searchParams.get('p2') || '')
  const [player1Data, setPlayer1Data] = useState<PlayerComparison | null>(null)
  const [player2Data, setPlayer2Data] = useState<PlayerComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch all players for dropdown
  useEffect(() => {
    fetchAllPlayers()
  }, [])

  // Auto-compare when both players are selected
  useEffect(() => {
    if (player1Id && player2Id) {
      comparePlayers()
    }
  }, [player1Id, player2Id])

  const fetchAllPlayers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/players/all`)
      const result = await response.json()

      if (result.success && result.data && result.indices) {
        const { data, indices } = result
        
        // Transform the raw array data using the indices
        const transformedPlayers: Player[] = data
          .filter((player: any[]) => player[indices.gamesPlayed] > 0) // Only players who played
          .map((player: any[]) => ({
            id: String(player[indices.playerId]),
            name: player[indices.displayFirstLast] || 'Unknown Player',
            team: player[indices.teamAbbreviation] || 'FA',
            position: player[indices.position] || 'N/A',
            ppg: parseFloat(player[indices.ppg]) || 0,
            rpg: parseFloat(player[indices.rpg]) || 0,
            apg: parseFloat(player[indices.apg]) || 0
          }))
          .sort((a: Player, b: Player) => a.name.localeCompare(b.name))

        setAllPlayers(transformedPlayers)
      }
    } catch (error) {
      console.error('Error fetching players:', error)
    }
  }

  const comparePlayers = async () => {
    try {
      setLoading(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      
      const response = await fetch(`${apiUrl}/api/compare/${player1Id}/${player2Id}`)
      const data = await response.json()

      if (data.success) {
        setPlayer1Data(data.player1)
        setPlayer2Data(data.player2)
      } else {
        setError(data.error || 'Failed to compare players')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error comparing players:', err)
      setError('Failed to fetch comparison data')
      setLoading(false)
    }
  }

  // Calculate player "stock price" based on performance
  const calculateStockPrice = (stats: any) => {
    const basePrice = 50
    const multiplier = (stats.ppg * 2) + stats.rpg + (stats.apg * 1.5) + (stats.fgPct * 100)
    return (basePrice + multiplier).toFixed(2)
  }

  // Create chart data
  const createChartData = () => {
    if (!player1Data || !player2Data) return []
    
    const p1Name = player1Data.name.split(' ').pop() || 'Player 1'
    const p2Name = player2Data.name.split(' ').pop() || 'Player 2'
    
    return [
      {
        category: 'PPG',
        [p1Name]: player1Data.stats.ppg,
        [p2Name]: player2Data.stats.ppg,
      },
      {
        category: 'RPG',
        [p1Name]: player1Data.stats.rpg,
        [p2Name]: player2Data.stats.rpg,
      },
      {
        category: 'APG',
        [p1Name]: player1Data.stats.apg,
        [p2Name]: player2Data.stats.apg,
      },
      {
        category: 'FG%',
        [p1Name]: player1Data.stats.fgPct * 100,
        [p2Name]: player2Data.stats.fgPct * 100,
      },
      {
        category: '3P%',
        [p1Name]: player1Data.stats.fg3Pct * 100,
        [p2Name]: player2Data.stats.fg3Pct * 100,
      },
    ]
  }

  // Create radar chart data
  const createRadarData = () => {
    if (!player1Data || !player2Data) return []
    
    const p1Name = player1Data.name.split(' ').pop() || 'P1'
    const p2Name = player2Data.name.split(' ').pop() || 'P2'
    
    return [
      {
        stat: 'Scoring',
        [p1Name]: Math.min(player1Data.stats.ppg * 3, 100),
        [p2Name]: Math.min(player2Data.stats.ppg * 3, 100),
      },
      {
        stat: 'Rebounds',
        [p1Name]: Math.min(player1Data.stats.rpg * 8, 100),
        [p2Name]: Math.min(player2Data.stats.rpg * 8, 100),
      },
      {
        stat: 'Assists',
        [p1Name]: Math.min(player1Data.stats.apg * 8, 100),
        [p2Name]: Math.min(player2Data.stats.apg * 8, 100),
      },
      {
        stat: 'Efficiency',
        [p1Name]: player1Data.stats.fgPct * 200,
        [p2Name]: player2Data.stats.fgPct * 200,
      },
      {
        stat: 'Experience',
        [p1Name]: Math.min(player1Data.careerStats.seasons * 10, 100),
        [p2Name]: Math.min(player2Data.careerStats.seasons * 10, 100),
      },
    ]
  }

  return (
    <main className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => router.push('/')}
                className="text-primary hover:text-yellow-300 transition-colors"
              >
                <span className="text-2xl">←</span>
              </button>
              <h1 className="text-4xl md:text-5xl font-black text-primary uppercase tracking-tight">
                Player Comparison Tool
              </h1>
            </div>
            <p className="text-text-muted text-sm uppercase tracking-wider font-semibold">
              📊 Side-by-Side Performance Analysis
            </p>
          </div>
        </div>

        {/* Player Selection */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-6">
          <h3 className="font-black text-primary mb-4 flex items-center gap-2 text-lg uppercase">
            <span>🎯</span> Select Players to Compare
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player 1 Selector */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                Player 1
              </label>
              <select
                value={player1Id}
                onChange={(e) => setPlayer1Id(e.target.value)}
                className="w-full px-4 py-4 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
              >
                <option value="">Select a player...</option>
                {allPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team}) - {player.ppg.toFixed(1)} PPG
                  </option>
                ))}
              </select>
            </div>

            {/* VS Badge */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 -translate-x-1/2 z-10">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg">
                <span className="text-black font-black text-xl">VS</span>
              </div>
            </div>

            {/* Player 2 Selector */}
            <div>
              <label className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                Player 2
              </label>
              <select
                value={player2Id}
                onChange={(e) => setPlayer2Id(e.target.value)}
                className="w-full px-4 py-4 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
              >
                <option value="">Select a player...</option>
                {allPlayers.map(player => (
                  <option key={player.id} value={player.id}>
                    {player.name} ({player.team}) - {player.ppg.toFixed(1)} PPG
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-primary mt-4 font-bold uppercase tracking-wider">Analyzing Performance...</p>
          </div>
        ) : player1Data && player2Data ? (
          <div className="space-y-6">
            {(() => {
              // Extract player names for chart usage (avoid inline .pop() which can return undefined)
              const player1LastName = player1Data.name.split(' ').pop() || 'Player 1'
              const player2LastName = player2Data.name.split(' ').pop() || 'Player 2'
              
              return (
                <>
            {/* Player Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 Card */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-primary">{player1Data.name}</h2>
                    <p className="text-text-muted text-sm uppercase font-bold">{player1Data.team} • {player1Data.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase font-bold">Stock Price</p>
                    <p className="text-3xl font-black text-primary">${calculateStockPrice(player1Data.stats)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Age</p>
                    <p className="text-xl font-black text-white">{player1Data.age}</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Height</p>
                    <p className="text-xl font-black text-white">{player1Data.height}</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Experience</p>
                    <p className="text-xl font-black text-white">{player1Data.careerStats.seasons}y</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-border-dark">
                    <span className="text-sm font-bold text-text-muted uppercase">Points Per Game</span>
                    <span className="text-xl font-black text-white">{player1Data.stats.ppg.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-dark">
                    <span className="text-sm font-bold text-text-muted uppercase">Rebounds Per Game</span>
                    <span className="text-xl font-black text-white">{player1Data.stats.rpg.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-dark">
                    <span className="text-sm font-bold text-text-muted uppercase">Assists Per Game</span>
                    <span className="text-xl font-black text-white">{player1Data.stats.apg.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-text-muted uppercase">Field Goal %</span>
                    <span className="text-xl font-black text-white">{(player1Data.stats.fgPct * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Player 2 Card */}
              <div className="bg-gradient-to-br from-market-red/20 to-market-red/5 border border-market-red rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">{player2Data.name}</h2>
                    <p className="text-text-muted text-sm uppercase font-bold">{player2Data.team} • {player2Data.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-text-muted uppercase font-bold">Stock Price</p>
                    <p className="text-3xl font-black text-market-red">${calculateStockPrice(player2Data.stats)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-background-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Age</p>
                    <p className="text-xl font-black text-white">{player2Data.age}</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Height</p>
                    <p className="text-xl font-black text-white">{player2Data.height}</p>
                  </div>
                  <div className="bg-background-dark rounded-lg p-3 text-center">
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Experience</p>
                    <p className="text-xl font-black text-white">{player2Data.careerStats.seasons}y</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-border-dark">
                    <span className="text-sm font-bold text-text-muted uppercase">Points Per Game</span>
                    <span className="text-xl font-black text-white">{player2Data.stats.ppg.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-dark">
                    <span className="text-sm font-bold text-text-muted uppercase">Rebounds Per Game</span>
                    <span className="text-xl font-black text-white">{player2Data.stats.rpg.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border-dark">
                    <span className="text-sm font-bold text-text-muted uppercase">Assists Per Game</span>
                    <span className="text-xl font-black text-white">{player2Data.stats.apg.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-bold text-text-muted uppercase">Field Goal %</span>
                    <span className="text-xl font-black text-white">{(player2Data.stats.fgPct * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart */}
              <div className="bg-card-dark border border-border-dark rounded-xl p-6">
                <h3 className="font-black text-primary mb-4 uppercase tracking-wider">Stats Comparison</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={createChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="category" stroke="#999" />
                    <YAxis stroke="#999" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      labelStyle={{ color: '#FCD34D' }}
                    />
                    <Legend />
                    <Bar dataKey={player1LastName} fill="#FCD34D" />
                    <Bar dataKey={player2LastName} fill="#EF4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Radar Chart */}
              <div className="bg-card-dark border border-border-dark rounded-xl p-6">
                <h3 className="font-black text-primary mb-4 uppercase tracking-wider">Performance Radar</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={createRadarData()}>
                    <PolarGrid stroke="#333" />
                    <PolarAngleAxis dataKey="stat" stroke="#999" />
                    <PolarRadiusAxis stroke="#999" />
                    <Radar 
                      name={player1LastName} 
                      dataKey={player1LastName} 
                      stroke="#FCD34D" 
                      fill="#FCD34D" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name={player2LastName} 
                      dataKey={player2LastName} 
                      stroke="#EF4444" 
                      fill="#EF4444" 
                      fillOpacity={0.3} 
                    />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Career Stats */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6">
              <h3 className="font-black text-primary mb-4 uppercase tracking-wider">Career Totals</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase font-bold mb-2">Total Points</p>
                  <p className="text-2xl font-black text-primary mb-1">{player1Data.careerStats.totalPoints.toLocaleString()}</p>
                  <p className="text-xl font-black text-market-red">{player2Data.careerStats.totalPoints.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase font-bold mb-2">Total Rebounds</p>
                  <p className="text-2xl font-black text-primary mb-1">{player1Data.careerStats.totalRebounds.toLocaleString()}</p>
                  <p className="text-xl font-black text-market-red">{player2Data.careerStats.totalRebounds.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase font-bold mb-2">Total Assists</p>
                  <p className="text-2xl font-black text-primary mb-1">{player1Data.careerStats.totalAssists.toLocaleString()}</p>
                  <p className="text-xl font-black text-market-red">{player2Data.careerStats.totalAssists.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-text-muted uppercase font-bold mb-2">Seasons</p>
                  <p className="text-2xl font-black text-primary mb-1">{player1Data.careerStats.seasons}</p>
                  <p className="text-xl font-black text-market-red">{player2Data.careerStats.seasons}</p>
                </div>
              </div>
            </div>
                </>
              )
            })()}
          </div>
        ) : player1Id && player2Id ? (
          <div className="bg-market-red/10 border border-market-red rounded-xl p-8 text-center">
            <p className="text-market-red font-bold text-xl">{error || 'Unable to load comparison'}</p>
          </div>
        ) : (
          <div className="bg-card-dark border border-border-dark rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-2xl font-black text-primary mb-2 uppercase">Select Two Players</h2>
            <p className="text-text-muted">Choose players from the dropdowns above to compare their performance</p>
          </div>
        )}
      </div>
    </main>
  )
}

// Wrap the component in Suspense to fix Next.js build error
export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏀</div>
          <p className="text-primary font-bold text-xl uppercase tracking-wider">Loading comparison tool...</p>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
}
