'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { isValidUSCEmail } from '@/lib/supabase-browser'

interface AuthFormProps {
  initialMode?: 'signin' | 'signup'
}

export default function AuthForm({ initialMode = 'signin' }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    // Validate USC email
    if (!isValidUSCEmail(email)) {
      setError('Please use your @usc.edu email address')
      return
    }

    // Validate password
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    if (mode === 'signup') {
      const { error } = await signUp(email, password)
      if (error) {
        setError(error.message)
      }
      // Auto signs in on success, no action needed
    } else {
      const { error } = await signIn(email, password)
      if (error) {
        setError(error.message)
      }
    }

    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-sm w-full">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            USC Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ttrojan@usc.edu"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000] focus:border-transparent outline-none text-black"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#990000] focus:border-transparent outline-none text-black"
            required
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}

        {message && (
          <p className="text-green-600 text-sm">{message}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#990000] text-white py-2 rounded-lg font-medium hover:bg-[#7a0000] transition-colors disabled:opacity-50"
        >
          {loading ? 'Loading...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        {mode === 'signin' ? (
          <>
            Don't have an account?{' '}
            <button
              onClick={() => { setMode('signup'); setError(null); setMessage(null) }}
              className="text-[#990000] font-medium hover:underline"
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button
              onClick={() => { setMode('signin'); setError(null); setMessage(null) }}
              className="text-[#990000] font-medium hover:underline"
            >
              Sign In
            </button>
          </>
        )}
      </p>

      <p className="mt-3 text-center text-xs text-gray-500">
        Only @usc.edu emails are allowed
      </p>
    </div>
  )
}
