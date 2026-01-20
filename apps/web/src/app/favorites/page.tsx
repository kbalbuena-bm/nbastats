// My Favorites Page
// Shows all players and teams the user has favorited

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface FavoritePlayer {
  id: number
  player_id: string
  player_name: string
  team: string
  created_at: string
}

export default function FavoritesPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [favoritePlayers, setFavoritePlayers] = useState<FavoritePlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // Redirect to login if not logged in
        router.push('/login')
      } else {
        fetchFavorites()
      }
    }
  }, [user, authLoading, router])

  const fetchFavorites = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('favorite_players')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setFavoritePlayers(data || [])
      setLoading(false)
    } catch (err) {
      console.error('Error fetching favorites:', err)
      setError('Failed to load favorites')
      setLoading(false)
    }
  }

  const removeFavorite = async (id: number) => {
    try {
      const { error } = await supabase
        .from('favorite_players')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Remove from local state
      setFavoritePlayers(favoritePlayers.filter(fav => fav.id !== id))
    } catch (err) {
      console.error('Error removing favorite:', err)
      alert('Failed to remove favorite')
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-24 w-24 border-b-8 border-yellow-400 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">⭐</span>
              </div>
            </div>
            <p className="text-yellow-400 mt-6 font-black text-xl">LOADING FAVORITES...</p>
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
              MY FAVORITES
            </h1>
            <p className="text-gray-400 mt-2 font-semibold">
              {favoritePlayers.length} player{favoritePlayers.length !== 1 ? 's' : ''} saved
            </p>
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
          <div className="bg-red-900 border-2 border-red-500 rounded-2xl p-6 text-center">
            <p className="text-white font-bold">⚠️ {error}</p>
          </div>
        )}

        {/* Favorites Grid */}
        {favoritePlayers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoritePlayers.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-6 hover:border-yellow-300 transition-all transform hover:scale-105 shadow-2xl"
              >
                {/* Player Image */}
                <div className="relative mb-4">
                  <img
                    src={`https://cdn.nba.com/headshots/nba/latest/1040x760/${favorite.player_id}.png`}
                    alt={favorite.player_name}
                    className="w-full h-48 object-cover rounded-xl"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'https://via.placeholder.com/300x300?text=No+Image'
                    }}
                  />
                  <div className="absolute top-2 right-2 bg-yellow-400 text-black px-3 py-1 rounded-full font-black text-sm">
                    ⭐ FAVORITE
                  </div>
                </div>

                {/* Player Info */}
                <div className="space-y-2">
                  <h3 className="text-white font-black text-xl">{favorite.player_name}</h3>
                  <p className="text-gray-400 font-bold">{favorite.team}</p>
                  <p className="text-gray-500 text-xs">
                    Added {new Date(favorite.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/player/${favorite.player_id}`)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    VIEW PROFILE
                  </button>
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl hover:from-red-700 hover:to-red-800 transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">⭐</div>
            <h2 className="text-2xl font-black text-yellow-400 mb-2">NO FAVORITES YET</h2>
            <p className="text-gray-400 mb-6">Start adding your favorite players from the home page!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105"
            >
              BROWSE PLAYERS
            </button>
          </div>
        )}
      </div>
    </main>
  )
}

