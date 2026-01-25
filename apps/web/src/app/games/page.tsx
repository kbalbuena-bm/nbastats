'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic'

interface Game {
  gameId: string
  gameDate: string
  homeTeam: {
    id: string
    name: string
    abbr: string
    score: number
  }
  awayTeam: {
    id: string
    name: string
    abbr: string
    score: number
  }
  gameStatus: string
  period: number
  time: string
}

export default function GamesPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchGames()
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchGames, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchGames = async () => {
    try {
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/games/today`)
      const data = await response.json()

      if (data.success && data.data) {
        const gameHeader = data.data.gameHeader
        const lineScore = data.data.lineScore

        if (!gameHeader || !lineScore) {
          setGames([])
          setLoading(false)
          return
        }

        const parsedGames: Game[] = gameHeader.rowSet.map((game: any[]) => {
          const headers = gameHeader.headers
          const gameId = game[headers.indexOf('GAME_ID')]
          
          // Find line scores for this game
          const homeLineScore = lineScore.rowSet.find((ls: any[]) => 
            ls[lineScore.headers.indexOf('GAME_ID')] === gameId &&
            ls[lineScore.headers.indexOf('TEAM_ID')] === game[headers.indexOf('HOME_TEAM_ID')]
          )
          const awayLineScore = lineScore.rowSet.find((ls: any[]) => 
            ls[lineScore.headers.indexOf('GAME_ID')] === gameId &&
            ls[lineScore.headers.indexOf('TEAM_ID')] !== game[headers.indexOf('HOME_TEAM_ID')]
          )

          return {
            gameId,
            gameDate: game[headers.indexOf('GAME_DATE_EST')],
            homeTeam: {
              id: game[headers.indexOf('HOME_TEAM_ID')],
              name: game[headers.indexOf('HOME_TEAM_NAME')] || 'Home',
              abbr: homeLineScore?.[lineScore.headers.indexOf('TEAM_ABBREVIATION')] || 'HOME',
              score: homeLineScore?.[lineScore.headers.indexOf('PTS')] || 0
            },
            awayTeam: {
              id: game[headers.indexOf('VISITOR_TEAM_ID')],
              name: game[headers.indexOf('VISITOR_TEAM_NAME')] || 'Away',
              abbr: awayLineScore?.[lineScore.headers.indexOf('TEAM_ABBREVIATION')] || 'AWAY',
              score: awayLineScore?.[lineScore.headers.indexOf('PTS')] || 0
            },
            gameStatus: game[headers.indexOf('GAME_STATUS_TEXT')] || '',
            period: game[headers.indexOf('PERIOD')] || 0,
            time: game[headers.indexOf('LIVE_PC_TIME')] || ''
          }
        })

        setGames(parsedGames)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching games:', err)
      setError('Failed to load games')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-24 w-24 border-b-8 border-yellow-400 mx-auto glow-yellow"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">🏀</span>
              </div>
            </div>
            <p className="text-yellow-400 mt-6 font-black text-xl">LOADING GAMES...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
              LIVE GAMES
            </h1>
            <p className="text-gray-400 mt-2 font-semibold">Today's NBA Action • Auto-refreshes every 30s</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105"
          >
            ← BACK
          </button>
        </div>

        {/* Games Grid */}
        {games.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {games.map((game) => (
              <div key={game.gameId} className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl overflow-hidden shadow-2xl">
                {/* Game Status Bar */}
                <div className="bg-black border-b-2 border-gray-700 px-6 py-3 flex justify-between items-center">
                  <div className="text-yellow-400 font-black text-sm">
                    {game.gameStatus.includes('Final') ? '🏁 FINAL' : 
                     game.gameStatus === 'TBD' ? '🕐 UPCOMING' : 
                     '🔴 LIVE'}
                  </div>
                  <div className="text-gray-400 text-sm font-bold">
                    {game.time || game.gameStatus}
                  </div>
                </div>

                {/* Teams */}
                <div className="p-6 space-y-4">
                  {/* Away Team */}
                  <div className="flex justify-between items-center bg-black border-2 border-gray-700 rounded-xl p-4 hover:border-yellow-400 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-yellow-400 font-black text-lg">{game.awayTeam.abbr}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold">{game.awayTeam.name}</div>
                        <div className="text-gray-500 text-xs">Away</div>
                      </div>
                    </div>
                    <div className="text-4xl font-black text-white">
                      {game.awayTeam.score}
                    </div>
                  </div>

                  {/* Home Team */}
                  <div className="flex justify-between items-center bg-black border-2 border-gray-700 rounded-xl p-4 hover:border-yellow-400 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center">
                        <span className="text-black font-black text-lg">{game.homeTeam.abbr}</span>
                      </div>
                      <div>
                        <div className="text-white font-bold">{game.homeTeam.name}</div>
                        <div className="text-gray-500 text-xs">Home</div>
                      </div>
                    </div>
                    <div className="text-4xl font-black text-white">
                      {game.homeTeam.score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h2 className="text-2xl font-black text-yellow-400 mb-2">NO GAMES TODAY</h2>
            <p className="text-gray-400">Check back on game days for live scores!</p>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-900 to-red-800 border-2 border-red-500 rounded-2xl p-8">
            <p className="text-white font-black text-xl">{error}</p>
          </div>
        )}
      </div>
    </main>
  )
}

