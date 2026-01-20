// Signup Page
// New users create their account here

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const { error } = await signUp(email, password)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-green-900 to-green-800 border-2 border-green-500 rounded-2xl p-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-black text-white mb-2">Account Created!</h2>
            <p className="text-green-200">Check your email to confirm your account.</p>
            <p className="text-green-300 mt-4">Redirecting to login...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 mb-2">
            SIGN UP
          </h1>
          <p className="text-gray-400">Create your NBA Stats account</p>
        </div>

        {/* Signup Form */}
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
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-yellow-400 font-bold hover:text-yellow-300 transition-colors"
              >
                Log in here
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

