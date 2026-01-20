'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic'

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
  const [conferenceFilter, setConferenceFilter] = useState<'all' | 'East' | 'West'>('all')

  // Fetch teams with stats on mount
  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      setLoadingTeams(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      
      const response = await fetch(`${apiUrl}/api/teams/stats`)
      const data = await response.json()

      if (data.success && data.data) {
        // Enrich teams with abbreviations, colors, and logo URLs
        const enrichedTeams: TeamWithStats[] = data.data.map((team: any) => {
          const teamInfo = NBA_TEAMS_MAP[team.id] || { abbr: 'NBA', color: '#FCD34D' }
          return {
            ...team,
            abbr: teamInfo.abbr,
            color: teamInfo.color,
            logoUrl: `https://cdn.nba.com/logos/nba/${team.id}/primary/L/logo.svg`
          }
        })

        setTeams(enrichedTeams)
      } else {
        setError(data.error || 'Failed to load teams')
      }

      setLoadingTeams(false)
    } catch (err) {
      console.error('Error fetching teams:', err)
      setError('Failed to fetch teams from API')
      setLoadingTeams(false)
    }
  }

  const fetchRoster = async (teamId: string) => {
    try {
      setLoading(true)
      setError('')
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      
      const response = await fetch(`${apiUrl}/api/team/${teamId}/roster`)
      const data = await response.json()

      if (data.success && data.data) {
        const headers = data.data.headers
        const players = data.data.rowSet

        const parsedRoster: Player[] = players.map((player: any[]) => {
          return {
            id: player[headers.indexOf('PLAYER_ID')]?.toString() || '',
            name: player[headers.indexOf('PLAYER')] || 'Unknown',
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

  // Filter teams by conference
  const filteredTeams = teams.filter(team => 
    conferenceFilter === 'all' || team.conference === conferenceFilter
  )

  // Calculate team "market cap" (simple formula based on performance)
  const calculateMarketCap = (team: TeamWithStats) => {
    const winRate = team.wins / (team.wins + team.losses) || 0
    const baseValue = 2500 // Million
    return (baseValue * (1 + winRate * 0.5)).toFixed(0)
  }

  return (
    <main className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-[1800px] mx-auto space-y-6">
        
        {/* Header with Navigation */}
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
                Franchise Exchange
              </h1>
            </div>
            <p className="text-text-muted text-sm uppercase tracking-wider font-semibold">
              📊 30 Team Portfolios • Live Performance Data
            </p>
          </div>

          {/* Conference Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setConferenceFilter('all')}
              className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                conferenceFilter === 'all'
                  ? 'bg-primary text-black'
                  : 'bg-card-dark border border-border-dark text-text-muted hover:border-primary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setConferenceFilter('East')}
              className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                conferenceFilter === 'East'
                  ? 'bg-primary text-black'
                  : 'bg-card-dark border border-border-dark text-text-muted hover:border-primary'
              }`}
            >
              Eastern
            </button>
            <button
              onClick={() => setConferenceFilter('West')}
              className={`px-6 py-2 rounded-lg font-bold uppercase text-sm transition-all ${
                conferenceFilter === 'West'
                  ? 'bg-primary text-black'
                  : 'bg-card-dark border border-border-dark text-text-muted hover:border-primary'
              }`}
            >
              Western
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && !loadingTeams && (
          <div className="bg-market-red/10 border border-market-red rounded-xl p-6 text-center">
            <p className="text-market-red font-bold mb-3">⚠️ {error}</p>
            <button
              onClick={fetchTeams}
              className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:bg-yellow-300 transition-all"
            >
              🔄 Reconnect to Market
            </button>
          </div>
        )}

        {/* Loading State */}
        {loadingTeams ? (
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-primary mt-4 font-bold uppercase tracking-wider">Loading Franchises...</p>
          </div>
        ) : !error && filteredTeams.length === 0 ? (
          <div className="bg-card-dark border border-border-dark rounded-xl p-12 text-center">
            <div className="text-6xl mb-4">🏀</div>
            <h2 className="text-2xl font-black text-primary mb-2">NO FRANCHISES FOUND</h2>
            <p className="text-text-muted">Try adjusting your conference filter</p>
          </div>
        ) : (
          <>
            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {filteredTeams.map((team) => {
                const marketCap = calculateMarketCap(team)
                const winPct = ((team.wins / (team.wins + team.losses)) * 100).toFixed(1)
                
                return (
                  <button
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    className={`p-4 rounded-xl transition-all border text-left ${
                      selectedTeam?.id === team.id
                        ? 'bg-gradient-to-br from-primary/20 to-primary/10 border-primary shadow-lg shadow-primary/20'
                        : 'bg-card-dark/50 border-border-dark hover:border-primary/50'
                    }`}
                  >
                    {/* Team Logo and Ticker */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg p-1.5 flex items-center justify-center">
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
                        <div>
                          <p className="font-black text-white text-sm uppercase tracking-wide">{team.abbr}</p>
                          <p className="text-xs text-text-muted uppercase font-bold">{team.conference}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted uppercase font-bold">Rank</p>
                        <p className="text-primary font-black text-lg">#{team.conferenceRank}</p>
                      </div>
                    </div>

                    {/* Team Name */}
                    <h3 className="font-bold text-white text-xs mb-3 truncate">{team.name}</h3>

                    {/* Market Cap */}
                    <div className="mb-3 pb-3 border-b border-border-dark">
                      <p className="text-xs text-text-muted uppercase font-bold mb-1">Market Cap</p>
                      <p className="text-primary font-black text-lg">${marketCap}M</p>
                    </div>

                    {/* Record */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs text-text-muted uppercase font-bold">Record</p>
                        <p className="text-white font-bold">{team.wins}-{team.losses}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-muted uppercase font-bold">Win %</p>
                        <p className={`font-bold ${parseFloat(winPct) >= 50 ? 'text-market-green' : 'text-market-red'}`}>
                          {winPct}%
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-background-dark rounded-lg p-2">
                        <p className="text-xs text-text-muted font-bold">PPG</p>
                        <p className="text-white font-bold text-sm">{team.ppg.toFixed(1)}</p>
                      </div>
                      <div className="bg-background-dark rounded-lg p-2">
                        <p className="text-xs text-text-muted font-bold">RPG</p>
                        <p className="text-white font-bold text-sm">{team.rpg.toFixed(1)}</p>
                      </div>
                      <div className="bg-background-dark rounded-lg p-2">
                        <p className="text-xs text-text-muted font-bold">APG</p>
                        <p className="text-white font-bold text-sm">{team.apg.toFixed(1)}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Selected Team Roster */}
            {selectedTeam && (
              <div className="mt-8 bg-card-dark border border-border-dark rounded-xl overflow-hidden">
                {/* Roster Header */}
                <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 border-b border-border-dark">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl p-2 flex items-center justify-center">
                      <img 
                        src={selectedTeam.logoUrl} 
                        alt={selectedTeam.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-primary uppercase">{selectedTeam.name}</h2>
                      <p className="text-text-muted uppercase text-sm font-bold tracking-wider">
                        Active Roster • {selectedTeam.wins}-{selectedTeam.losses} ({((selectedTeam.wins / (selectedTeam.wins + selectedTeam.losses)) * 100).toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Roster Content */}
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-3"></div>
                      <p className="text-text-muted font-bold">Loading roster...</p>
                    </div>
                  ) : roster.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-text-muted">No roster data available</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {roster.map((player) => (
                        <div
                          key={player.id}
                          onClick={() => router.push(`/player/${player.id}`)}
                          className="bg-background-dark border border-border-dark rounded-lg p-4 hover:border-primary transition-all cursor-pointer"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className="font-bold text-white text-sm">{player.name}</p>
                              <p className="text-xs text-text-muted uppercase font-bold">{player.position}</p>
                            </div>
                            {player.number !== '-' && (
                              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-black font-black text-xs">#{player.number}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <div>
                              <p className="text-text-muted font-bold">HT</p>
                              <p className="text-white font-semibold">{player.height}</p>
                            </div>
                            <div>
                              <p className="text-text-muted font-bold">WT</p>
                              <p className="text-white font-semibold">{player.weight}</p>
                            </div>
                            <div>
                              <p className="text-text-muted font-bold">AGE</p>
                              <p className="text-white font-semibold">{player.age}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
