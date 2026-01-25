// Signup Page
// New users create their account here

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering (don't pre-render at build time)
export const dynamic = 'force-dynamic'

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
      <main className="min-h-screen bg-black py-8 px-4 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="bg-card-dark border border-primary rounded-xl p-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-black text-primary mb-2 uppercase">Account Created!</h2>
            <p className="text-text-muted">Check your email to confirm your account.</p>
            <p className="text-primary mt-4 font-semibold">Redirecting to login...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">📊</div>
          <h1 className="text-5xl font-black text-primary uppercase tracking-tight mb-2">
            Sign Up
          </h1>
          <p className="text-text-muted text-sm uppercase tracking-wider font-semibold">
            Join the HoopMarket trading floor
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-card-dark border border-border-dark rounded-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                placeholder="••••••••"
              />
              <p className="text-xs text-text-muted mt-1">Must be at least 6 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-bold text-text-muted mb-2 uppercase tracking-wider">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-white font-semibold"
                placeholder="••••••••"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-market-red/10 border border-market-red rounded-lg p-3 text-market-red text-sm font-semibold">
                ⚠️ {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary text-background-dark font-black rounded-lg hover:bg-primary/80 transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-primary font-bold hover:text-primary/80 transition-colors"
              >
                Log in here
              </button>
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-text-muted hover:text-white transition-colors text-sm"
            >
              ← Back to home
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

