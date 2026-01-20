// User Profile Page
// Shows user account information and stats

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  
  const [favoriteCount, setFavoriteCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else {
        fetchUserStats()
      }
    }
  }, [user, authLoading, router])

  const fetchUserStats = async () => {
    try {
      setLoading(true)

      // Count favorite players
      const { count } = await supabase
        .from('favorite_players')
        .select('*', { count: 'exact', head: true })

      setFavoriteCount(count || 0)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching user stats:', err)
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (authLoading || loading || !user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-24 w-24 border-b-8 border-yellow-400 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-4xl">👤</span>
              </div>
            </div>
            <p className="text-yellow-400 mt-6 font-black text-xl">LOADING PROFILE...</p>
          </div>
        </div>
      </main>
    )
  }

  const userCreatedDate = new Date(user.created_at || '').toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500">
            MY PROFILE
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105"
          >
            ← BACK
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-8 shadow-2xl">
          
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-5xl font-black text-black">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-1">{user.email?.split('@')[0]}</h2>
              <p className="text-gray-400 font-bold">{user.email}</p>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-black text-yellow-400 mb-4">ACCOUNT INFORMATION</h3>
            
            <div className="bg-black border-2 border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">User ID</span>
                <span className="text-white font-mono text-sm">{user.id.slice(0, 8)}...</span>
              </div>
            </div>

            <div className="bg-black border-2 border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">Email</span>
                <span className="text-white">{user.email}</span>
              </div>
            </div>

            <div className="bg-black border-2 border-gray-700 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 font-bold">Member Since</span>
                <span className="text-white">{userCreatedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4 mb-8">
            <h3 className="text-xl font-black text-yellow-400 mb-4">MY STATS</h3>
            
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-xl p-6 text-center">
              <div className="text-5xl font-black text-black mb-2">{favoriteCount}</div>
              <div className="text-black font-bold">Favorite Players</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => router.push('/favorites')}
              className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-black rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>⭐</span> VIEW MY FAVORITES
            </button>
            <button
              onClick={handleSignOut}
              className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-black rounded-xl hover:from-red-700 hover:to-red-800 transition-all transform hover:scale-105"
            >
              SIGN OUT
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

