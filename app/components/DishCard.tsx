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
  const [userComment, setUserComment] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<{ score: number; comment: string }[]>([])
  const [averageRating, setAverageRating] = useState(initialAvgRating)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [loadingUserRating, setLoadingUserRating] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [moderationError, setModerationError] = useState('')

  // Fetch user's existing rating and all comments
  useEffect(() => {
    if (user) {
      fetchUserRating()
    }
    fetchComments()
  }, [user, menuItemId])

  const fetchUserRating = async () => {
    if (!user) return
    setLoadingUserRating(true)

    const { data } = await supabaseBrowser
      .from('ratings')
      .select('score, comment')
      .eq('menu_item_id', menuItemId)
      .eq('user_id', user.id)
      .single()

    if (data) {
      setUserRating(data.score)
      if (data.comment) {
        setUserComment(data.comment)
        setCommentDraft(data.comment)
      }
    }
    setLoadingUserRating(false)
  }

  const fetchComments = async () => {
    const { data } = await supabaseBrowser
      .from('ratings')
      .select('score, comment')
      .eq('menu_item_id', menuItemId)
      .not('comment', 'is', null)
      .neq('comment', '')
      .order('created_at', { ascending: false })

    if (data) {
      setComments(data)
    }
  }

  const handleSaveComment = async () => {
    if (!user || userRating === null) return
    setSavingComment(true)
    setModerationError('')

    // Check content moderation
    if (commentDraft.trim()) {
      try {
        const modResponse = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commentDraft.trim() }),
        })
        const modResult = await modResponse.json()
        if (modResult.flagged) {
          setModerationError(modResult.message || 'Comment contains inappropriate content.')
          setSavingComment(false)
          return
        }
      } catch (err) {
        console.error('Moderation check failed:', err)
        // Continue if moderation service is unavailable
      }
    }

    const { error } = await supabaseBrowser
      .from('ratings')
      .upsert({
        menu_item_id: menuItemId,
        user_id: user.id,
        score: userRating,
        comment: commentDraft.trim(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'menu_item_id,user_id'
      })

    if (!error) {
      setUserComment(commentDraft.trim())
      fetchComments()
    }
    setSavingComment(false)
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
            <>
              <RatingInput
                onRate={handleRate}
                currentRating={userRating || undefined}
              />
              {userRating !== null && (
                <div className="mt-2">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => setCommentDraft(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#990000] focus:border-[#990000]"
                  />
                  {moderationError && (
                    <p className="text-xs text-red-600 mt-1">{moderationError}</p>
                  )}
                  {commentDraft.trim() !== userComment && (
                    <button
                      onClick={handleSaveComment}
                      disabled={savingComment}
                      className="mt-1 text-xs bg-[#990000] text-white px-3 py-1 rounded hover:bg-[#7a0000] disabled:opacity-50"
                    >
                      {savingComment ? 'Saving...' : 'Save Comment'}
                    </button>
                  )}
                </div>
              )}
            </>
          )
        ) : (
          <p className="text-xs text-gray-500">
            <span className="text-[#990000] font-medium">Sign in</span> to rate this dish
          </p>
        )}
      </div>

      {/* Comments section */}
      {comments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Comments</p>
          <ul className="space-y-2">
            {comments.map((c, i) => (
              <li key={i} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className={`w-3 h-3 ${s <= c.score ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {c.comment}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
