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
  const [userRating, setUserRating] = useState<number | null>(null)
  const [averageRating, setAverageRating] = useState(initialAvgRating)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [loadingUserRating, setLoadingUserRating] = useState(false)

  // Fetch user's existing rating when they log in
  useEffect(() => {
    if (user) {
      fetchUserRating()
    }
  }, [user, menuItemId])

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      {/* Dish name and rating */}
      <h3 className="font-semibold text-gray-800 text-lg mb-2">{name}</h3>
      <div className="mb-3">
        <StarRating rating={averageRating} count={ratingCount} size="sm" />
      </div>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Ingredients</p>
          <ul className="space-y-1">
            {ingredients.map((ingredient, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#990000] rounded-full flex-shrink-0"></span>
                {ingredient}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rating section */}
      <div className="pt-3 border-t border-gray-100">
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
    </div>
  )
}
