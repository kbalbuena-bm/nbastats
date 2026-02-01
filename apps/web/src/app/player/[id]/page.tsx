'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic'

interface PlayerInfo {
  headers: string[]
  rowSet: any[][]
}

interface ValuationData {
  playerId: string
  season: string
  playerAge: number
  currentSeasonImpactScore: number
  weightedImpactScore: number
  ageFactor: number
  adjustedImpactScore: number
  fairAAV: number
  actualAAV: number | null
  surplusValue: number | null
  stockIndex: number
  trajectory: 'rising' | 'stable' | 'declining' | 'unknown'
  explanationBreakdown: {
    impactScoreWeights: Record<string, number>
    currentSeasonBreakdown: {
      pointsPer36: number
      assistsPer36: number
      reboundsPer36: number
      stealsPer36: number
      blocksPer36: number
      trueShootingPct: number
      turnoversPer36: number
      rawImpactScore: number
    } | null
    recencyWeights: { weight: number; season: string; impactScore: number }[]
    agingAdjustment: {
      age: number
      peakAgeRange: string
      adjustmentPercent: number
    }
    fairAAVCalibration: {
      method: string
      medianSalary: number
      topSalary: number
      impactScoreToAAVSlope: number
    }
    stockIndexCalculation: {
      surplusValue: number | null
      percentileRank: number
      trajectoryBonus: number
    }
  }
}

const calculateAge = (birthDate: string): number => {
  if (!birthDate) return 0
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

const formatCurrency = (value: number): string => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

const getTrajectoryInfo = (trajectory: string): { emoji: string; label: string; color: string } => {
  switch (trajectory) {
    case 'rising':
      return { emoji: '📈', label: 'Rising', color: 'text-primary' }
    case 'declining':
      return { emoji: '📉', label: 'Declining', color: 'text-market-red' }
    case 'stable':
      return { emoji: '➡️', label: 'Stable', color: 'text-text-muted' }
    default:
      return { emoji: '❓', label: 'Unknown', color: 'text-text-muted' }
  }
}

const getStockIndexColor = (index: number): string => {
  if (index >= 70) return 'text-primary'
  if (index >= 40) return 'text-yellow-400'
  return 'text-market-red'
}

const getStockIndexLabel = (index: number): string => {
  if (index >= 80) return 'Elite Value'
  if (index >= 60) return 'Great Value'
  if (index >= 40) return 'Fair Value'
  if (index >= 20) return 'Overpaid'
  return 'Poor Value'
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [playerData, setPlayerData] = useState<any>(null)
  const [valuationData, setValuationData] = useState<ValuationData | null>(null)
  const [valuationLoading, setValuationLoading] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  useEffect(() => {
    if (playerId) {
      fetchPlayerData()
      fetchValuationData()
    }
  }, [playerId])

  const fetchValuationData = async () => {
    try {
      setValuationLoading(true)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/player/${playerId}/valuation`)
      const data = await response.json()

      if (data.success && data.valuation) {
        setValuationData(data.valuation)
      }
    } catch (err) {
      console.error('Error fetching valuation data:', err)
      // Silently fail - valuation is optional
    } finally {
      setValuationLoading(false)
    }
  }

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      setError('')

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/player/${playerId}/detail`)
      const data = await response.json()

      if (data.success) {
        setPlayerData(data.data)
      } else {
        setError('Failed to load player stock data')
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching player data:', err)
      setError('Failed to connect to market data.')
      setLoading(false)
    }
  }

  const getPlayerInfo = () => {
    if (!playerData?.playerInfo?.[0]) return null
    const info = playerData.playerInfo[0]
    const headers = info.headers
    const data = info.rowSet[0]
    
    return {
      name: data[headers.indexOf('DISPLAY_FIRST_LAST')],
      firstName: data[headers.indexOf('FIRST_NAME')],
      lastName: data[headers.indexOf('LAST_NAME')],
      jersey: data[headers.indexOf('JERSEY')],
      position: data[headers.indexOf('POSITION')],
      height: data[headers.indexOf('HEIGHT')],
      weight: data[headers.indexOf('WEIGHT')],
      birthDate: data[headers.indexOf('BIRTHDATE')],
      age: data[headers.indexOf('PLAYER_AGE')] || calculateAge(data[headers.indexOf('BIRTHDATE')]),
      experience: data[headers.indexOf('SEASON_EXP')],
      school: data[headers.indexOf('SCHOOL')],
      country: data[headers.indexOf('COUNTRY')],
      teamId: data[headers.indexOf('TEAM_ID')],
      teamName: data[headers.indexOf('TEAM_NAME')],
      teamAbbr: data[headers.indexOf('TEAM_ABBREVIATION')],
      draftYear: data[headers.indexOf('DRAFT_YEAR')],
      draftRound: data[headers.indexOf('DRAFT_ROUND')],
      draftNumber: data[headers.indexOf('DRAFT_NUMBER')]
    }
  }

  const getCareerStats = () => {
    if (!playerData?.careerStats?.[0]) return []
    const stats = playerData.careerStats.find((rs: any) => rs.name === 'SeasonTotalsRegularSeason')
    if (!stats) return []
    
    return stats.rowSet.map((row: any[]) => {
      const headers = stats.headers
      return {
        season: row[headers.indexOf('SEASON_ID')],
        team: row[headers.indexOf('TEAM_ABBREVIATION')],
        age: row[headers.indexOf('PLAYER_AGE')],
        gp: row[headers.indexOf('GP')],
        gs: row[headers.indexOf('GS')],
        min: row[headers.indexOf('MIN')],
        pts: row[headers.indexOf('PTS')],
        reb: row[headers.indexOf('REB')],
        ast: row[headers.indexOf('AST')],
        stl: row[headers.indexOf('STL')],
        blk: row[headers.indexOf('BLK')],
        fgPct: row[headers.indexOf('FG_PCT')],
        fg3Pct: row[headers.indexOf('FG3_PCT')],
        ftPct: row[headers.indexOf('FT_PCT')]
      }
    }).reverse()
  }

  const getRecentGames = () => {
    if (!playerData?.gameLog?.[0]) return []
    const gameLog = playerData.gameLog[0]
    
    return gameLog.rowSet.slice(0, 10).map((row: any[]) => {
      const headers = gameLog.headers
      return {
        gameId: row[headers.indexOf('Game_ID')],
        date: row[headers.indexOf('GAME_DATE')],
        matchup: row[headers.indexOf('MATCHUP')],
        result: row[headers.indexOf('WL')],
        min: row[headers.indexOf('MIN')],
        pts: row[headers.indexOf('PTS')],
        reb: row[headers.indexOf('REB')],
        ast: row[headers.indexOf('AST')],
        stl: row[headers.indexOf('STL')],
        blk: row[headers.indexOf('BLK')],
        fgm: row[headers.indexOf('FGM')],
        fga: row[headers.indexOf('FGA')],
        fg3m: row[headers.indexOf('FG3M')],
        fg3a: row[headers.indexOf('FG3A')],
        plusMinus: row[headers.indexOf('PLUS_MINUS')]
      }
    })
  }

  const getShotChartData = () => {
    if (!playerData?.shotChart?.[0]) return { made: [], missed: [] }
    const shotData = playerData.shotChart[0]
    
    const made: any[] = []
    const missed: any[] = []
    
    shotData.rowSet.forEach((row: any[]) => {
      const headers = shotData.headers
      const shot = {
        x: row[headers.indexOf('LOC_X')],
        y: row[headers.indexOf('LOC_Y')],
        made: row[headers.indexOf('SHOT_MADE_FLAG')] === 1,
        distance: row[headers.indexOf('SHOT_DISTANCE')],
        zone: row[headers.indexOf('SHOT_ZONE_BASIC')]
      }
      
      if (shot.made) {
        made.push(shot)
      } else {
        missed.push(shot)
      }
    })
    
    return { made, missed }
  }

  const getGeneralSplits = () => {
    if (!playerData?.generalSplits?.[0]) return []
    const splits = playerData.generalSplits[0]
    
    return splits.rowSet.map((row: any[]) => {
      const headers = splits.headers
      return {
        groupValue: row[headers.indexOf('GROUP_VALUE')],
        gp: row[headers.indexOf('GP')],
        pts: row[headers.indexOf('PTS')],
        reb: row[headers.indexOf('REB')],
        ast: row[headers.indexOf('AST')],
        fgPct: row[headers.indexOf('FG_PCT')],
        fg3Pct: row[headers.indexOf('FG3_PCT')]
      }
    })
  }

  const playerInfo = getPlayerInfo()
  const careerStats = getCareerStats()
  const recentGames = getRecentGames()
  const shotChart = getShotChartData()
  const splits = getGeneralSplits()

  // Calculate stock metrics
  const latestSeason = careerStats[0]
  const stockPrice = latestSeason ? (latestSeason.pts * 10) + (latestSeason.ast * 5) + (latestSeason.reb * 3) : 0
  const priceChange = Math.random() * 40 - 15
  const percentChange = stockPrice > 0 ? (priceChange / stockPrice) * 100 : 0
  const marketCap = stockPrice * (latestSeason?.gp || 1) * 1000000
  const perIndex = latestSeason ? ((latestSeason.pts + latestSeason.reb + latestSeason.ast) / 3).toFixed(1) : '0'
  const volatility = Math.abs(percentChange) < 5 ? 'Low' : Math.abs(percentChange) < 10 ? 'Medium' : 'High'

  if (loading) {
    return (
      <main className="min-h-screen bg-background-dark py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-24 w-24 border-b-8 border-primary mx-auto glow-green"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">📊</span>
              </div>
            </div>
            <p className="text-primary mt-6 font-black text-xl">LOADING STOCK ANALYSIS...</p>
          </div>
        </div>
      </main>
    )
  }

  if (error || !playerInfo) {
    return (
      <main className="min-h-screen bg-background-dark py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 px-4 py-2 bg-primary text-background-dark font-bold rounded-lg hover:bg-primary/80 transition-all"
          >
            ← Back to Market
          </button>
          <div className="bg-market-red/20 border-2 border-market-red rounded-2xl p-8">
            <p className="text-white font-black text-xl">{error || 'Stock not found'}</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background-dark">
      {/* Top Navigation */}
      <header className="flex items-center justify-between border-b border-border-dark px-10 py-3 bg-background-dark sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-4">
            <div className="text-primary text-2xl">📈</div>
            <h2 className="text-white text-lg font-bold leading-tight tracking-tight">HoopMarket</h2>
          </div>
          <nav className="flex items-center gap-9">
            <button onClick={() => router.push('/')} className="text-text-muted hover:text-white text-sm font-medium transition-colors">Dashboard</button>
            <button onClick={() => router.push('/teams')} className="text-white text-sm font-medium">Teams</button>
            <button onClick={() => router.push('/compare')} className="text-text-muted hover:text-white text-sm font-medium transition-colors">Screener</button>
          </nav>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-border-dark text-white hover:bg-border-dark/80 rounded-lg transition-all"
        >
          ← Back
        </button>
      </header>

      <div className="max-w-[1440px] mx-auto w-full px-6 py-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => router.push('/')} className="text-text-muted text-sm font-medium hover:text-primary transition-colors">NBA Market</button>
          <span className="text-text-muted text-sm font-medium">/</span>
          <span className="text-white text-sm font-medium">{playerInfo.name}</span>
        </div>

        {/* Profile Header */}
        <div className="flex flex-col mb-8">
          <div className="flex w-full flex-col gap-6 lg:flex-row lg:justify-between lg:items-center bg-card-dark p-6 rounded-xl border border-border-dark">
            <div className="flex gap-6 items-center">
              <img
                src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${playerId}.png`}
                alt={playerInfo.name}
                className="bg-background-dark rounded-xl min-h-32 w-32 border-2 border-primary object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                }}
              />
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-white text-3xl font-bold leading-tight tracking-tight">{playerInfo.name}</h1>
                  <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded uppercase">{volatility} Vol</span>
                </div>
                <p className="text-text-muted text-lg font-medium">{playerInfo.teamName} · {playerInfo.position} · #{playerInfo.jersey}</p>
                <div className="mt-2 flex items-center gap-4">
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">Current Stock Price</p>
                    <p className="text-white text-2xl font-bold">
                      ${stockPrice.toFixed(2)} 
                      <span className={`text-sm font-medium ml-1 ${percentChange >= 0 ? 'text-primary' : 'text-market-red'}`}>
                        {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}% today
                      </span>
                    </p>
                  </div>
                  <div className="h-10 w-[1px] bg-border-dark"></div>
                  <div>
                    <p className="text-text-muted text-xs uppercase tracking-wider">Market Sentiment</p>
                    <p className="text-primary text-sm font-bold flex items-center gap-1">
                      ⚡ {percentChange >= 0 ? 'STRONG BUY' : 'HOLD'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex w-full max-w-[320px] gap-3">
              <button className="flex-1 flex items-center justify-center rounded-lg h-12 px-6 bg-border-dark text-white text-base font-bold hover:bg-border-dark/80 transition-all">
                Sell Share
              </button>
              <button className="flex-1 flex items-center justify-center rounded-lg h-12 px-6 bg-primary text-background-dark text-base font-bold hover:bg-primary/80 transition-all">
                Buy Share
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-dark bg-card-dark/40">
            <div className="flex justify-between items-start">
              <p className="text-text-muted text-sm font-medium">Market Cap</p>
              <span className="text-primary text-lg">💰</span>
            </div>
            <p className="text-white text-2xl font-bold">${(marketCap / 1000000).toFixed(1)}M</p>
            <p className="text-primary text-xs font-medium flex items-center gap-1">
              🔼 Top tier asset
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-dark bg-card-dark/40">
            <div className="flex justify-between items-start">
              <p className="text-text-muted text-sm font-medium">PER Index</p>
              <span className="text-primary text-lg">📊</span>
            </div>
            <p className="text-white text-2xl font-bold">{perIndex}</p>
            <p className="text-primary text-xs font-medium flex items-center gap-1">
              ↑ Elite performer
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-dark bg-card-dark/40">
            <div className="flex justify-between items-start">
              <p className="text-text-muted text-sm font-medium">Volatility</p>
              <span className="text-primary text-lg">📈</span>
            </div>
            <p className="text-white text-2xl font-bold">{volatility}</p>
            <p className="text-text-muted text-xs font-medium italic">Consistency rated</p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-5 border border-border-dark bg-card-dark/40">
            <div className="flex justify-between items-start">
              <p className="text-text-muted text-sm font-medium">Daily Volume</p>
              <span className="text-primary text-lg">🔄</span>
            </div>
            <p className="text-white text-2xl font-bold">{latestSeason ? (latestSeason.gp * 12500).toLocaleString() : '0'}</p>
            <p className="text-primary text-xs font-medium flex items-center gap-1">
              📈 High activity
            </p>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chart Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Performance Chart */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-white text-xl font-bold">Performance Stock Chart</h3>
                  <p className="text-text-muted text-sm">Career progression index</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 rounded text-xs font-bold bg-border-dark text-white">1W</button>
                  <button className="px-3 py-1 rounded text-xs font-bold bg-primary text-background-dark">Career</button>
                </div>
              </div>

              {/* Career Chart */}
              {careerStats.length > 0 && (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={careerStats.slice().reverse()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#234836" />
                    <XAxis
                      dataKey="season"
                      tick={{ fill: '#92c9ad', fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fill: '#92c9ad' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#162e22', border: '1px solid #234836', borderRadius: '8px' }}
                      labelStyle={{ color: '#13ec80', fontWeight: 'bold' }}
                    />
                    <Legend wrapperStyle={{ color: '#FFF' }} />
                    <Line type="monotone" dataKey="pts" stroke="#13ec80" strokeWidth={3} name="Points" dot={{ fill: '#13ec80', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Market Fundamentals */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-card-dark border border-border-dark rounded-xl p-5">
                <h4 className="text-text-muted text-xs uppercase font-bold tracking-widest mb-1">Points Per Game</h4>
                <p className="text-white text-2xl font-bold">{latestSeason?.pts.toFixed(1) || '0'}</p>
                <div className="w-full bg-border-dark h-1 rounded-full mt-2">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((latestSeason?.pts || 0) / 35 * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="bg-card-dark border border-border-dark rounded-xl p-5">
                <h4 className="text-text-muted text-xs uppercase font-bold tracking-widest mb-1">Assists Per Game</h4>
                <p className="text-white text-2xl font-bold">{latestSeason?.ast.toFixed(1) || '0'}</p>
                <div className="w-full bg-border-dark h-1 rounded-full mt-2">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((latestSeason?.ast || 0) / 12 * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="bg-card-dark border border-border-dark rounded-xl p-5">
                <h4 className="text-text-muted text-xs uppercase font-bold tracking-widest mb-1">Rebounds Per Game</h4>
                <p className="text-white text-2xl font-bold">{latestSeason?.reb.toFixed(1) || '0'}</p>
                <div className="w-full bg-border-dark h-1 rounded-full mt-2">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min((latestSeason?.reb || 0) / 15 * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Recent Games (Trading History) */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6">
              <h3 className="text-white text-xl font-bold mb-4">Recent Trading History</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
                {recentGames.map((game: any, index: number) => (
                  <div key={index} className={`bg-background-dark border ${game.result === 'W' ? 'border-primary' : 'border-market-red'} rounded-xl p-4`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-white text-sm">{game.matchup}</div>
                        <div className="text-xs text-text-muted">{new Date(game.date).toLocaleDateString()}</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full font-black text-sm ${game.result === 'W' ? 'bg-primary text-background-dark' : 'bg-market-red text-white'}`}>
                        {game.result}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xl font-black text-white">{game.pts}</div>
                        <div className="text-xs text-text-muted">PTS</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-white">{game.reb}</div>
                        <div className="text-xs text-text-muted">REB</div>
                      </div>
                      <div>
                        <div className="text-xl font-black text-white">{game.ast}</div>
                        <div className="text-xs text-text-muted">AST</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-text-muted flex justify-between">
                      <span>{game.fgm}/{game.fga} FG</span>
                      <span>{game.fg3m}/{game.fg3a} 3PT</span>
                      <span className={game.plusMinus >= 0 ? 'text-primary' : 'text-market-red'}>
                        {game.plusMinus >= 0 ? '+' : ''}{game.plusMinus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">

            {/* Player Evaluation Card */}
            {valuationLoading ? (
              <div className="bg-card-dark border border-border-dark rounded-xl p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-border-dark rounded w-1/2"></div>
                  <div className="h-20 bg-border-dark rounded"></div>
                  <div className="h-4 bg-border-dark rounded w-3/4"></div>
                </div>
              </div>
            ) : valuationData ? (
              <div className="bg-card-dark border-2 border-primary rounded-xl p-6">
                <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                  <span>💎</span> Player Evaluation
                </h3>

                {/* Stock Index - Big Display */}
                <div className="text-center mb-6">
                  <div className={`text-5xl font-black ${getStockIndexColor(valuationData.stockIndex)}`}>
                    {valuationData.stockIndex.toFixed(0)}
                  </div>
                  <div className="text-text-muted text-sm font-medium mt-1">Stock Index</div>
                  <div className={`text-sm font-bold mt-1 ${getStockIndexColor(valuationData.stockIndex)}`}>
                    {getStockIndexLabel(valuationData.stockIndex)}
                  </div>
                </div>

                {/* Trajectory */}
                <div className="flex justify-center items-center gap-2 mb-6">
                  <span className="text-2xl">{getTrajectoryInfo(valuationData.trajectory).emoji}</span>
                  <span className={`font-bold ${getTrajectoryInfo(valuationData.trajectory).color}`}>
                    {getTrajectoryInfo(valuationData.trajectory).label} Trajectory
                  </span>
                </div>

                {/* AAV Comparison */}
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted text-sm">Fair Market AAV</span>
                    <span className="text-primary font-bold">{formatCurrency(valuationData.fairAAV)}</span>
                  </div>

                  {valuationData.actualAAV !== null ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted text-sm">Actual AAV</span>
                        <span className="text-white font-bold">{formatCurrency(valuationData.actualAAV)}</span>
                      </div>
                      <div className="h-px bg-border-dark"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted text-sm">Surplus Value</span>
                        <span className={`font-bold ${valuationData.surplusValue && valuationData.surplusValue >= 0 ? 'text-primary' : 'text-market-red'}`}>
                          {valuationData.surplusValue && valuationData.surplusValue >= 0 ? '+' : ''}
                          {formatCurrency(valuationData.surplusValue || 0)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-text-muted text-sm italic text-center py-2 bg-border-dark/30 rounded-lg">
                      Salary data unavailable
                    </div>
                  )}
                </div>

                {/* Impact Score */}
                <div className="bg-background-dark rounded-lg p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-muted text-xs uppercase tracking-wider">Impact Score</span>
                    <span className="text-white font-bold">{valuationData.adjustedImpactScore.toFixed(1)}</span>
                  </div>
                  <div className="w-full bg-border-dark h-2 rounded-full mt-2">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((valuationData.adjustedImpactScore / 25) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Why This Rating - Collapsible */}
                <button
                  onClick={() => setShowExplanation(!showExplanation)}
                  className="w-full text-left text-sm text-text-muted hover:text-white transition-colors flex items-center justify-between"
                >
                  <span>Why this rating?</span>
                  <span className="transform transition-transform duration-200" style={{ transform: showExplanation ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    ▼
                  </span>
                </button>

                {showExplanation && (
                  <div className="mt-4 pt-4 border-t border-border-dark space-y-4 text-xs">
                    {/* Current Season Breakdown */}
                    {valuationData.explanationBreakdown.currentSeasonBreakdown && (
                      <div>
                        <h4 className="text-primary font-bold mb-2">Per-36 Stats (Current Season)</h4>
                        <div className="grid grid-cols-2 gap-2 text-text-muted">
                          <div>PTS: {valuationData.explanationBreakdown.currentSeasonBreakdown.pointsPer36.toFixed(1)}</div>
                          <div>AST: {valuationData.explanationBreakdown.currentSeasonBreakdown.assistsPer36.toFixed(1)}</div>
                          <div>REB: {valuationData.explanationBreakdown.currentSeasonBreakdown.reboundsPer36.toFixed(1)}</div>
                          <div>STL: {valuationData.explanationBreakdown.currentSeasonBreakdown.stealsPer36.toFixed(1)}</div>
                          <div>BLK: {valuationData.explanationBreakdown.currentSeasonBreakdown.blocksPer36.toFixed(1)}</div>
                          <div>TS%: {(valuationData.explanationBreakdown.currentSeasonBreakdown.trueShootingPct * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    )}

                    {/* Recency Weights */}
                    {valuationData.explanationBreakdown.recencyWeights.length > 0 && (
                      <div>
                        <h4 className="text-primary font-bold mb-2">Season Weights</h4>
                        <div className="space-y-1 text-text-muted">
                          {valuationData.explanationBreakdown.recencyWeights.map((sw, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{sw.season}</span>
                              <span>{(sw.weight * 100).toFixed(0)}% weight → {sw.impactScore.toFixed(1)} score</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Age Adjustment */}
                    <div>
                      <h4 className="text-primary font-bold mb-2">Age Adjustment</h4>
                      <div className="text-text-muted">
                        <div>Age: {valuationData.explanationBreakdown.agingAdjustment.age}</div>
                        <div>Peak Range: {valuationData.explanationBreakdown.agingAdjustment.peakAgeRange}</div>
                        <div className={valuationData.explanationBreakdown.agingAdjustment.adjustmentPercent >= 0 ? 'text-primary' : 'text-market-red'}>
                          Adjustment: {valuationData.explanationBreakdown.agingAdjustment.adjustmentPercent >= 0 ? '+' : ''}
                          {valuationData.explanationBreakdown.agingAdjustment.adjustmentPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Model Weights */}
                    <div>
                      <h4 className="text-primary font-bold mb-2">Impact Score Weights</h4>
                      <div className="grid grid-cols-2 gap-1 text-text-muted">
                        <div>Points: {(valuationData.explanationBreakdown.impactScoreWeights.pointsPer36 * 100).toFixed(0)}%</div>
                        <div>Assists: {(valuationData.explanationBreakdown.impactScoreWeights.assistsPer36 * 100).toFixed(0)}%</div>
                        <div>Rebounds: {(valuationData.explanationBreakdown.impactScoreWeights.reboundsPer36 * 100).toFixed(0)}%</div>
                        <div>Steals: {(valuationData.explanationBreakdown.impactScoreWeights.stealsPer36 * 100).toFixed(0)}%</div>
                        <div>Blocks: {(valuationData.explanationBreakdown.impactScoreWeights.blocksPer36 * 100).toFixed(0)}%</div>
                        <div>TS%: {(valuationData.explanationBreakdown.impactScoreWeights.trueShootingPct * 100).toFixed(0)}%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Bio Panel */}
            <div className="bg-card-dark border border-border-dark rounded-xl p-6">
              <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                <span>📋</span> Stock Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Age</span>
                  <span className="text-white font-bold">{playerInfo.age}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Experience</span>
                  <span className="text-white font-bold">{playerInfo.experience} years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Height</span>
                  <span className="text-white font-bold">{playerInfo.height}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Weight</span>
                  <span className="text-white font-bold">{playerInfo.weight} lbs</span>
                </div>
                {playerInfo.school && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">College</span>
                    <span className="text-white font-bold text-right">{playerInfo.school}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">From</span>
                  <span className="text-white font-bold">{playerInfo.country}</span>
                </div>
                {playerInfo.draftYear !== 'Undrafted' && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Draft</span>
                    <span className="text-white font-bold text-right">
                      {playerInfo.draftYear} Rd {playerInfo.draftRound}, #{playerInfo.draftNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Panel */}
            <div className="p-4 rounded-lg bg-border-dark/20 border border-border-dark">
              <div className="flex gap-2 text-text-muted">
                <span>ℹ️</span>
                <p className="text-xs leading-relaxed">
                  This is a simulated stock market for entertainment. Stock prices are calculated using performance metrics and statistical algorithms.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Career Stats Table */}
        {careerStats.length > 0 && (
          <div className="mt-8 bg-card-dark border border-border-dark rounded-xl p-6">
            <h2 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
              <span>📊</span> Historical Performance Data
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-background-dark border-b-2 border-primary">
                  <tr>
                    <th className="text-left py-3 px-4 text-primary font-black">SEASON</th>
                    <th className="text-left py-3 px-4 text-primary font-black">TEAM</th>
                    <th className="text-center py-3 px-4 text-primary font-black">GP</th>
                    <th className="text-center py-3 px-4 text-primary font-black">MIN</th>
                    <th className="text-center py-3 px-4 text-primary font-black">PTS</th>
                    <th className="text-center py-3 px-4 text-primary font-black">REB</th>
                    <th className="text-center py-3 px-4 text-primary font-black">AST</th>
                    <th className="text-center py-3 px-4 text-primary font-black">FG%</th>
                    <th className="text-center py-3 px-4 text-primary font-black">3P%</th>
                  </tr>
                </thead>
                <tbody>
                  {careerStats.map((season: any, index: number) => (
                    <tr key={index} className="border-b border-border-dark hover:bg-border-dark/30 transition-colors">
                      <td className="py-3 px-4 text-white font-bold">{season.season}</td>
                      <td className="py-3 px-4 text-white font-bold">{season.team}</td>
                      <td className="py-3 px-4 text-center text-text-muted">{season.gp}</td>
                      <td className="py-3 px-4 text-center text-text-muted">{season.min.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center text-primary font-bold">{season.pts.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center text-white font-bold">{season.reb.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center text-white font-bold">{season.ast.toFixed(1)}</td>
                      <td className="py-3 px-4 text-center text-text-muted">{(season.fgPct * 100).toFixed(1)}%</td>
                      <td className="py-3 px-4 text-center text-text-muted">{(season.fg3Pct * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-border-dark py-8">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="text-primary text-2xl">📈</div>
            <p className="text-text-muted text-sm">© 2026 HoopMarket. Data powered by NBA Stats API.</p>
          </div>
          <div className="flex gap-8">
            <button onClick={() => router.push('/')} className="text-text-muted text-sm hover:text-white transition-colors">Market Dashboard</button>
            <button onClick={() => router.push('/teams')} className="text-text-muted text-sm hover:text-white transition-colors">Teams</button>
            <button onClick={() => router.push('/compare')} className="text-text-muted text-sm hover:text-white transition-colors">Compare</button>
          </div>
        </div>
      </footer>
    </main>
  )
}
