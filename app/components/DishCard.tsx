'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { supabaseBrowser } from '@/lib/supabase-browser'
import StarRating from './StarRating'
import RatingInput from './RatingInput'

interface DishCardProps {
  menuItemId: string
  name: string
  ingredients: string[]
  averageRating: number
  ratingCount: number
}

export default function DishCard({
  menuItemId,
  name,
  ingredients,
  averageRating: initialAvgRating,
  ratingCount: initialCount
}: DishCardProps) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState(initialAvgRating)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [loadingUserRating, setLoadingUserRating] = useState(false)

  // Fetch user's existing rating when they log in
  useEffect(() => {
    if (user && isOpen) {
      fetchUserRating()
    }
  }, [user, isOpen, menuItemId])

  const fetchUserRating = async () => {
    if (!user) return
    setLoadingUserRating(true)

    const { data } = await supabaseBrowser
      .from('ratings')
      .select('score')
      .eq('menu_item_id', menuItemId)
      .eq('user_id', user.id)
      .single()

    if (data) {
      setUserRating(data.score)
    }
    setLoadingUserRating(false)
  }

  const handleRate = async (score: number) => {
    if (!user) return

    const { error } = await supabaseBrowser
      .from('ratings')
      .upsert({
        menu_item_id: menuItemId,
        user_id: user.id,
        score,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'menu_item_id,user_id'
      })

    if (error) {
      console.error('Rating error:', error.message)
      alert('Failed to save rating: ' + error.message)
      return
    } else {
      const wasNewRating = userRating === null
      setUserRating(score)

      // Update local average (approximation)
      if (wasNewRating) {
        const newCount = ratingCount + 1
        const newAvg = ((averageRating * ratingCount) + score) / newCount
        setAverageRating(newAvg)
        setRatingCount(newCount)
      } else {
        // Recalculate with updated rating
        const newAvg = ((averageRating * ratingCount) - (userRating || 0) + score) / ratingCount
        setAverageRating(newAvg)
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col gap-1">
          <span className="font-medium text-gray-800">{name}</span>
          <StarRating rating={averageRating} count={ratingCount} size="sm" />
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="px-4 pb-3 border-t border-gray-100">
          {/* User rating section */}
          <div className="mt-3 mb-3 pb-3 border-b border-gray-100">
            {user ? (
              loadingUserRating ? (
                <span className="text-xs text-gray-400">Loading...</span>
              ) : (
                <RatingInput
                  onRate={handleRate}
                  currentRating={userRating || undefined}
                />
              )
            ) : (
              <p className="text-xs text-gray-500">
                <span className="text-[#990000] font-medium">Sign in</span> to rate this dish
              </p>
            )}
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <>
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Ingredients</p>
              <ul className="space-y-1">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#990000] rounded-full flex-shrink-0"></span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}
