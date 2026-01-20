'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

      console.log('API Response:', result) // Debug log

      if (result.success && result.data && result.indices) {
        const { data, indices } = result
        
        // Transform the raw array data using the indices
        const transformedPlayers: Player[] = data
          .filter((player: any[]) => player[indices.gamesPlayed] > 0) // Only players who played
          .map((player: any[]) => ({
            id: String(player[indices.playerId] || ''),
            name: player[indices.playerName] || 'Unknown',
            team: player[indices.teamAbbrev] || 'N/A',
            position: player[indices.position] || 'N/A',
            ppg: player[indices.points] || 0,
            rpg: player[indices.rebounds] || 0,
            apg: player[indices.assists] || 0
          }))
        
        console.log('Transformed players:', transformedPlayers.length) // Debug log
        console.log('First 3 players:', transformedPlayers.slice(0, 3)) // Debug log
        
        // Sort by name
        const sortedPlayers = transformedPlayers.sort((a, b) => {
          return (a.name || '').localeCompare(b.name || '')
        })
        
        setAllPlayers(sortedPlayers)
      }
    } catch (err) {
      console.error('Error fetching players:', err)
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
        // Parse player 1
        const p1Info = data.player1.info?.[0]?.rowSet?.[0]
        const p1InfoHeaders = data.player1.info?.[0]?.headers || []
        const p1Current = data.player1.currentSeason?.[0]?.rowSet?.[0]
        const p1CurrentHeaders = data.player1.currentSeason?.[0]?.headers || []
        const p1Career = data.player1.careerStats?.[0]?.rowSet?.[0]
        const p1CareerHeaders = data.player1.careerStats?.[0]?.headers || []

        if (p1Info && p1Current) {
          setPlayer1Data({
            id: player1Id,
            name: p1Info[p1InfoHeaders.indexOf('DISPLAY_FIRST_LAST')] || 'N/A',
            team: p1Info[p1InfoHeaders.indexOf('TEAM_ABBREVIATION')] || 'N/A',
            position: p1Info[p1InfoHeaders.indexOf('POSITION')] || 'N/A',
            age: p1Info[p1InfoHeaders.indexOf('PLAYER_AGE')] || 0,
            height: p1Info[p1InfoHeaders.indexOf('HEIGHT')] || 'N/A',
            weight: p1Info[p1InfoHeaders.indexOf('WEIGHT')] || 'N/A',
            stats: {
              ppg: p1Current[p1CurrentHeaders.indexOf('PTS')] || 0,
              rpg: p1Current[p1CurrentHeaders.indexOf('REB')] || 0,
              apg: p1Current[p1CurrentHeaders.indexOf('AST')] || 0,
              fgPct: p1Current[p1CurrentHeaders.indexOf('FG_PCT')] || 0,
              fg3Pct: p1Current[p1CurrentHeaders.indexOf('FG3_PCT')] || 0,
              ftPct: p1Current[p1CurrentHeaders.indexOf('FT_PCT')] || 0,
              gp: p1Current[p1CurrentHeaders.indexOf('GP')] || 0,
              min: p1Current[p1CurrentHeaders.indexOf('MIN')] || 0
            },
            careerStats: p1Career ? {
              seasons: p1Career[p1CareerHeaders.indexOf('SEASON_ID')] || 0,
              totalPoints: p1Career[p1CareerHeaders.indexOf('PTS')] || 0,
              totalRebounds: p1Career[p1CareerHeaders.indexOf('REB')] || 0,
              totalAssists: p1Career[p1CareerHeaders.indexOf('AST')] || 0
            } : { seasons: 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 }
          })
        }

        // Parse player 2
        const p2Info = data.player2.info?.[0]?.rowSet?.[0]
        const p2InfoHeaders = data.player2.info?.[0]?.headers || []
        const p2Current = data.player2.currentSeason?.[0]?.rowSet?.[0]
        const p2CurrentHeaders = data.player2.currentSeason?.[0]?.headers || []
        const p2Career = data.player2.careerStats?.[0]?.rowSet?.[0]
        const p2CareerHeaders = data.player2.careerStats?.[0]?.headers || []

        if (p2Info && p2Current) {
          setPlayer2Data({
            id: player2Id,
            name: p2Info[p2InfoHeaders.indexOf('DISPLAY_FIRST_LAST')] || 'N/A',
            team: p2Info[p2InfoHeaders.indexOf('TEAM_ABBREVIATION')] || 'N/A',
            position: p2Info[p2InfoHeaders.indexOf('POSITION')] || 'N/A',
            age: p2Info[p2InfoHeaders.indexOf('PLAYER_AGE')] || 0,
            height: p2Info[p2InfoHeaders.indexOf('HEIGHT')] || 'N/A',
            weight: p2Info[p2InfoHeaders.indexOf('WEIGHT')] || 'N/A',
            stats: {
              ppg: p2Current[p2CurrentHeaders.indexOf('PTS')] || 0,
              rpg: p2Current[p2CurrentHeaders.indexOf('REB')] || 0,
              apg: p2Current[p2CurrentHeaders.indexOf('AST')] || 0,
              fgPct: p2Current[p2CurrentHeaders.indexOf('FG_PCT')] || 0,
              fg3Pct: p2Current[p2CurrentHeaders.indexOf('FG3_PCT')] || 0,
              ftPct: p2Current[p2CurrentHeaders.indexOf('FT_PCT')] || 0,
              gp: p2Current[p2CurrentHeaders.indexOf('GP')] || 0,
              min: p2Current[p2CurrentHeaders.indexOf('MIN')] || 0
            },
            careerStats: p2Career ? {
              seasons: p2Career[p2CareerHeaders.indexOf('SEASON_ID')] || 0,
              totalPoints: p2Career[p2CareerHeaders.indexOf('PTS')] || 0,
              totalRebounds: p2Career[p2CareerHeaders.indexOf('REB')] || 0,
              totalAssists: p2Career[p2CareerHeaders.indexOf('AST')] || 0
            } : { seasons: 0, totalPoints: 0, totalRebounds: 0, totalAssists: 0 }
          })
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error comparing players:', err)
      setError('Failed to compare players')
      setLoading(false)
    }
  }

  const StatBar = ({ label, value1, value2, unit = '' }: { label: string; value1: number; value2: number; unit?: string }) => {
    const max = Math.max(value1, value2)
    const pct1 = max > 0 ? (value1 / max) * 100 : 0
    const pct2 = max > 0 ? (value2 / max) * 100 : 0

    return (
      <div className="space-y-2">
        <div className="text-center text-sm font-bold text-gray-400">{label}</div>
        <div className="grid grid-cols-3 gap-4 items-center">
          {/* Player 1 bar */}
          <div className="text-right">
            <div className="flex justify-end mb-1">
              <div className="bg-gradient-to-l from-blue-500 to-blue-600 h-8 rounded-l-lg flex items-center justify-end px-2" style={{ width: `${pct1}%`, minWidth: '50px' }}>
                <span className="text-white font-black text-sm">{value1.toFixed(1)}{unit}</span>
              </div>
            </div>
          </div>
          
          {/* VS */}
          <div className="text-center text-yellow-400 font-black text-xs">VS</div>
          
          {/* Player 2 bar */}
          <div className="text-left">
            <div className="flex justify-start mb-1">
              <div className="bg-gradient-to-r from-red-500 to-red-600 h-8 rounded-r-lg flex items-center justify-start px-2" style={{ width: `${pct2}%`, minWidth: '50px' }}>
                <span className="text-white font-black text-sm">{value2.toFixed(1)}{unit}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
              PLAYER COMPARISON
            </h1>
            <p className="text-gray-400 mt-2 font-semibold">Compare stats between two players</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105"
          >
            ← BACK
          </button>
        </div>

        {/* Player Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Player 1 Selector */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-800 border-2 border-blue-500 rounded-2xl p-6">
            <h3 className="text-2xl font-black text-blue-400 mb-4">PLAYER 1</h3>
            <select
              value={player1Id}
              onChange={(e) => setPlayer1Id(e.target.value)}
              className="w-full bg-black text-white border-2 border-blue-500 rounded-xl p-4 font-bold text-lg focus:outline-none focus:border-blue-300"
            >
              <option value="">Select Player 1</option>
              {allPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.team})
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 Selector */}
          <div className="bg-gradient-to-br from-red-900 to-red-800 border-2 border-red-500 rounded-2xl p-6">
            <h3 className="text-2xl font-black text-red-400 mb-4">PLAYER 2</h3>
            <select
              value={player2Id}
              onChange={(e) => setPlayer2Id(e.target.value)}
              className="w-full bg-black text-white border-2 border-red-500 rounded-xl p-4 font-bold text-lg focus:outline-none focus:border-red-300"
            >
              <option value="">Select Player 2</option>
              {allPlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name} ({player.team})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Display */}
        {loading ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-yellow-400 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl">⚡</span>
              </div>
            </div>
            <p className="text-yellow-400 mt-4 font-bold text-xl">Comparing players...</p>
          </div>
        ) : player1Data && player2Data ? (
          <div className="space-y-8">
            
            {/* Player Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 Info */}
              <div className="bg-gradient-to-br from-blue-900 to-black border-2 border-blue-500 rounded-2xl p-6">
                <h2 className="text-3xl font-black text-white mb-4">{player1Data.name}</h2>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span className="font-bold">Team:</span>
                    <span className="text-blue-400 font-black">{player1Data.team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Position:</span>
                    <span className="text-blue-400 font-black">{player1Data.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Age:</span>
                    <span className="text-blue-400 font-black">{player1Data.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Height:</span>
                    <span className="text-blue-400 font-black">{player1Data.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Weight:</span>
                    <span className="text-blue-400 font-black">{player1Data.weight} lbs</span>
                  </div>
                </div>
              </div>

              {/* Player 2 Info */}
              <div className="bg-gradient-to-br from-red-900 to-black border-2 border-red-500 rounded-2xl p-6">
                <h2 className="text-3xl font-black text-white mb-4">{player2Data.name}</h2>
                <div className="space-y-2 text-gray-300">
                  <div className="flex justify-between">
                    <span className="font-bold">Team:</span>
                    <span className="text-red-400 font-black">{player2Data.team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Position:</span>
                    <span className="text-red-400 font-black">{player2Data.position}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Age:</span>
                    <span className="text-red-400 font-black">{player2Data.age}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Height:</span>
                    <span className="text-red-400 font-black">{player2Data.height}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold">Weight:</span>
                    <span className="text-red-400 font-black">{player2Data.weight} lbs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Comparison */}
            <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-8 space-y-6">
              <h3 className="text-3xl font-black text-yellow-400 text-center mb-8">SEASON STATS</h3>
              
              <StatBar label="POINTS PER GAME" value1={player1Data.stats.ppg} value2={player2Data.stats.ppg} />
              <StatBar label="REBOUNDS PER GAME" value1={player1Data.stats.rpg} value2={player2Data.stats.rpg} />
              <StatBar label="ASSISTS PER GAME" value1={player1Data.stats.apg} value2={player2Data.stats.apg} />
              <StatBar label="FIELD GOAL %" value1={player1Data.stats.fgPct * 100} value2={player2Data.stats.fgPct * 100} unit="%" />
              <StatBar label="3-POINT %" value1={player1Data.stats.fg3Pct * 100} value2={player2Data.stats.fg3Pct * 100} unit="%" />
              <StatBar label="FREE THROW %" value1={player1Data.stats.ftPct * 100} value2={player2Data.stats.ftPct * 100} unit="%" />
              <StatBar label="MINUTES PER GAME" value1={player1Data.stats.min} value2={player2Data.stats.min} />
            </div>
          </div>
        ) : player1Id && player2Id ? (
          <div className="bg-red-900 border-2 border-red-500 rounded-2xl p-8 text-center">
            <p className="text-white font-bold text-xl">{error || 'Unable to load comparison'}</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-2xl font-black text-yellow-400 mb-2">SELECT TWO PLAYERS</h2>
            <p className="text-gray-400">Choose players from the dropdowns above to compare their stats</p>
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
          <p className="text-yellow-400 font-bold text-xl">Loading comparison...</p>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  )
}
