'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Static list of current NBA teams with abbreviations for logo URLs
const NBA_TEAMS_MAP: Record<string, { abbr: string, color: string }> = {
  '1610612737': { abbr: 'ATL', color: '#E03A3E' },
  '1610612738': { abbr: 'BOS', color: '#007A33' },
  '1610612751': { abbr: 'BKN', color: '#000000' },
  '1610612766': { abbr: 'CHA', color: '#1D1160' },
  '1610612741': { abbr: 'CHI', color: '#CE1141' },
  '1610612739': { abbr: 'CLE', color: '#860038' },
  '1610612742': { abbr: 'DAL', color: '#00538C' },
  '1610612743': { abbr: 'DEN', color: '#0E2240' },
  '1610612765': { abbr: 'DET', color: '#C8102E' },
  '1610612744': { abbr: 'GSW', color: '#1D428A' },
  '1610612745': { abbr: 'HOU', color: '#CE1141' },
  '1610612754': { abbr: 'IND', color: '#002D62' },
  '1610612746': { abbr: 'LAC', color: '#C8102E' },
  '1610612747': { abbr: 'LAL', color: '#552583' },
  '1610612763': { abbr: 'MEM', color: '#5D76A9' },
  '1610612748': { abbr: 'MIA', color: '#98002E' },
  '1610612749': { abbr: 'MIL', color: '#00471B' },
  '1610612750': { abbr: 'MIN', color: '#0C2340' },
  '1610612740': { abbr: 'NOP', color: '#0C2340' },
  '1610612752': { abbr: 'NYK', color: '#006BB6' },
  '1610612760': { abbr: 'OKC', color: '#007AC1' },
  '1610612753': { abbr: 'ORL', color: '#0077C0' },
  '1610612755': { abbr: 'PHI', color: '#006BB6' },
  '1610612756': { abbr: 'PHX', color: '#1D1160' },
  '1610612757': { abbr: 'POR', color: '#E03A3E' },
  '1610612758': { abbr: 'SAC', color: '#5A2D81' },
  '1610612759': { abbr: 'SAS', color: '#C4CED4' },
  '1610612761': { abbr: 'TOR', color: '#CE1141' },
  '1610612762': { abbr: 'UTA', color: '#002B5C' },
  '1610612764': { abbr: 'WAS', color: '#002B5C' }
}

interface TeamWithStats {
  id: string
  name: string
  abbr: string
  wins: number
  losses: number
  ppg: number
  rpg: number
  apg: number
  conference: string
  conferenceRank: number
  color: string
  logoUrl: string
}

interface Player {
  id: string
  name: string
  number: string
  position: string
  height: string
  weight: string
  age: number
}

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamWithStats[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamWithStats | null>(null)
  const [roster, setRoster] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [error, setError] = useState('')

  // Fetch teams with stats on mount
  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      
      console.log('Fetching teams from:', `${apiUrl}/api/teams/stats`)
      const response = await fetch(`${apiUrl}/api/teams/stats`)
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Teams API response:', data)

      if (data.success && data.data) {
        console.log('Number of teams received:', data.data.length)
        
        // Enrich teams with abbreviations, colors, and logo URLs
        const enrichedTeams: TeamWithStats[] = data.data.map((team: any) => {
          const teamInfo = NBA_TEAMS_MAP[team.id] || { abbr: 'NBA', color: '#FCD34D' }
          return {
            ...team,
            abbr: teamInfo.abbr,
            color: teamInfo.color,
            logoUrl: `https://cdn.nba.com/logos/nba/${team.id}/global/L/logo.svg`
          }
        })

        console.log('Enriched teams:', enrichedTeams.length)

        // Sort by conference rank
        enrichedTeams.sort((a, b) => {
          if (a.conference !== b.conference) {
            return a.conference.localeCompare(b.conference)
          }
          return (a.conferenceRank || 99) - (b.conferenceRank || 99)
        })

        setTeams(enrichedTeams)
      } else {
        console.error('API returned unsuccessful or no data:', data)
        setError(data.message || 'Failed to fetch teams data')
      }

      setLoadingTeams(false)
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('Failed to load teams. Make sure the API is running.')
      setLoadingTeams(false)
    }
  }

  const fetchRoster = async (teamId: string) => {
    try {
      setLoading(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${apiUrl}/api/team/${teamId}/details`)
      const data = await response.json()

      if (data.success && data.data.roster) {
        const rosterData = data.data.roster
        const parsedRoster: Player[] = rosterData.rowSet.map((player: any[]) => {
          const headers = rosterData.headers
          return {
            id: player[headers.indexOf('PLAYER_ID')],
            name: player[headers.indexOf('PLAYER')],
            number: player[headers.indexOf('NUM')] || '-',
            position: player[headers.indexOf('POSITION')] || '-',
            height: player[headers.indexOf('HEIGHT')] || '-',
            weight: player[headers.indexOf('WEIGHT')] || '-',
            age: player[headers.indexOf('AGE')] || 0
          }
        })

        setRoster(parsedRoster.sort((a, b) => a.name.localeCompare(b.name)))
      }

      setLoading(false)
    } catch (err) {
      console.error('Error fetching roster:', err)
      setError('Failed to load roster')
      setLoading(false)
    }
  }

  const handleTeamClick = (team: TeamWithStats) => {
    setSelectedTeam(team)
    fetchRoster(team.id)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
              NBA TEAMS
            </h1>
            <p className="text-gray-400 mt-2 font-semibold">Select a team to view their roster</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105"
          >
            ← BACK
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900 border-2 border-red-500 rounded-2xl p-8 text-center mb-6">
            <p className="text-white font-bold text-xl mb-2">⚠️ {error}</p>
            <button
              onClick={fetchTeams}
              className="mt-4 px-6 py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-500 transition-all"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Teams Grid */}
        {loadingTeams ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🏀</span>
              </div>
            </div>
            <p className="text-yellow-400 mt-4 font-bold">Loading teams...</p>
          </div>
        ) : !error && teams.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h2 className="text-2xl font-black text-yellow-400 mb-2">NO TEAMS FOUND</h2>
            <p className="text-gray-400">Unable to load team data. Make sure the API is running.</p>
            <button
              onClick={fetchTeams}
              className="mt-6 px-6 py-3 bg-yellow-400 text-black font-black rounded-xl hover:bg-yellow-500 transition-all"
            >
              🔄 Retry
            </button>
          </div>
        ) : !error ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {teams.map((team) => (
              <button
                key={team.id}
                onClick={() => handleTeamClick(team)}
                className={`p-6 rounded-2xl font-bold transition-all transform hover:scale-105 border-2 text-left ${
                  selectedTeam?.id === team.id
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-black border-yellow-400 shadow-lg shadow-yellow-400/50'
                    : 'bg-gradient-to-br from-gray-900 to-black text-white border-gray-700 hover:border-yellow-400'
                }`}
              >
                {/* Team Logo and Info */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white rounded-lg p-2 flex items-center justify-center">
                    <img 
                      src={team.logoUrl} 
                      alt={team.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-black">{team.abbr}</div>
                    <div className="text-xs opacity-75">{team.name}</div>
                  </div>
                </div>

                {/* Record and Conference */}
                <div className={`mb-3 pb-3 border-b-2 ${selectedTeam?.id === team.id ? 'border-black' : 'border-gray-700'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm opacity-75">Record</span>
                    <span className="text-lg font-black">{team.wins}-{team.losses}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm opacity-75">{team.conference}</span>
                    <span className="text-sm font-black">#{team.conferenceRank || 'N/A'}</span>
                  </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className={`text-xl font-black ${selectedTeam?.id === team.id ? 'text-black' : 'text-yellow-400'}`}>
                      {team.ppg.toFixed(1)}
                    </div>
                    <div className="text-xs opacity-75">PPG</div>
                  </div>
                  <div>
                    <div className={`text-xl font-black ${selectedTeam?.id === team.id ? 'text-black' : 'text-purple-400'}`}>
                      {team.rpg.toFixed(1)}
                    </div>
                    <div className="text-xs opacity-75">RPG</div>
                  </div>
                  <div>
                    <div className={`text-xl font-black ${selectedTeam?.id === team.id ? 'text-black' : 'text-cyan-400'}`}>
                      {team.apg.toFixed(1)}
                    </div>
                    <div className="text-xs opacity-75">APG</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {/* Roster Display */}
        {selectedTeam && (
          <div className="space-y-6">
            {/* Team Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl p-6">
              <div className="flex items-center gap-6 mb-4">
                <div className="w-20 h-20 bg-white rounded-xl p-3 flex items-center justify-center">
                  <img 
                    src={selectedTeam.logoUrl} 
                    alt={selectedTeam.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                </div>
                <div className="flex-1">
                  <h2 className="text-4xl font-black text-black">{selectedTeam.name}</h2>
                  <div className="flex gap-4 mt-2">
                    <span className="text-black font-bold">Record: {selectedTeam.wins}-{selectedTeam.losses}</span>
                    <span className="text-black font-bold">•</span>
                    <span className="text-black font-bold">{selectedTeam.conference} #{selectedTeam.conferenceRank}</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 bg-black/20 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-3xl font-black text-black">{selectedTeam.ppg.toFixed(1)}</div>
                  <div className="text-sm font-bold text-black/70">Points Per Game</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">{selectedTeam.rpg.toFixed(1)}</div>
                  <div className="text-sm font-bold text-black/70">Rebounds Per Game</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-black text-black">{selectedTeam.apg.toFixed(1)}</div>
                  <div className="text-sm font-bold text-black/70">Assists Per Game</div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="relative inline-block">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-yellow-400 mx-auto"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🏀</span>
                  </div>
                </div>
                <p className="text-yellow-400 mt-4 font-bold">Loading roster...</p>
              </div>
            ) : error ? (
              <div className="bg-red-900 border-2 border-red-500 rounded-xl p-8 text-center">
                <p className="text-white font-bold">{error}</p>
              </div>
            ) : roster.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roster.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => router.push(`/player/${player.id}`)}
                    className="bg-gradient-to-br from-gray-900 to-black border-2 border-gray-700 rounded-xl p-4 hover:border-yellow-400 transition-all cursor-pointer transform hover:scale-105"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-white font-bold text-lg">{player.name}</h3>
                        <div className="text-yellow-400 text-sm font-bold">#{player.number} • {player.position}</div>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-400 mt-3 border-t border-gray-700 pt-3">
                      <div>
                        <div className="text-gray-500">Height</div>
                        <div className="text-white font-bold">{player.height}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Weight</div>
                        <div className="text-white font-bold">{player.weight} lbs</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Age</div>
                        <div className="text-white font-bold">{player.age}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </main>
  )
}

