'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import AuthForm from './AuthForm'

export default function UserNav() {
  const { user, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  if (loading) {
    return <div className="text-white/60 text-sm">Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-white/80 text-sm hidden sm:inline">{user.email}</span>
        <button
          onClick={() => signOut()}
          className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => { setAuthMode('signin'); setShowAuthModal(true) }}
          className="text-sm text-white hover:text-white/80 transition-colors"
        >
          Sign In
        </button>
        <span className="text-white/40">|</span>
        <button
          onClick={() => { setAuthMode('signup'); setShowAuthModal(true) }}
          className="text-sm bg-white text-[#990000] px-3 py-1 rounded font-medium hover:bg-gray-100 transition-colors"
        >
          Sign Up
        </button>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-2 -right-2 bg-gray-800 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-700"
            >
              ×
            </button>
            <AuthForm initialMode={authMode} />
          </div>
        </div>
      )}
    </>
  )
}
