// Login Page
// Users enter their email and password to log in

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/') // Redirect to homepage after login
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 mb-2">
            LOGIN
          </h1>
          <p className="text-gray-400">Welcome back to NBA Stats</p>
        </div>

        {/* Login Form */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-400 rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-black text-white border-2 border-gray-700 rounded-xl focus:border-yellow-400 focus:outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-black text-white border-2 border-gray-700 rounded-xl focus:border-yellow-400 focus:outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900 border-2 border-red-500 rounded-xl p-3 text-white text-sm">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-black rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'LOGGING IN...' : 'LOG IN'}
            </button>
          </form>

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/signup')}
                className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors"
              >
                Sign up here
              </button>
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

