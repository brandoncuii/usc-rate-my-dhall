'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { useRating } from '../hooks/useRating'
import StarRating from './StarRating'
import CommentSection from './CommentSection'

interface PreviousItemCardProps {
  menuItemId: string
  name: string
  ingredients: string[]
  averageRating: number
  ratingCount: number
}

export default function PreviousItemCard({
  menuItemId,
  name,
  ingredients,
  averageRating: initialAvgRating,
  ratingCount: initialCount,
}: PreviousItemCardProps) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)

  const rating = useRating({
    menuItemId,
    user,
    initialAvgRating,
    initialCount,
    fetchOnMount: false,
  })

  const handleToggle = async () => {
    const willExpand = !expanded
    setExpanded(willExpand)

    if (willExpand && !hasFetched) {
      await rating.fetchAll()
      setHasFetched(true)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-800">{name}</span>
        <div className="flex items-center gap-2">
          <StarRating rating={rating.averageRating} count={rating.ratingCount} size="sm" />
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100">
          {ingredients.length > 0 && (
            <div className="mt-3">
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

          <div className="mt-3">
            <CommentSection
              user={user}
              userRating={rating.userRating}
              loadingUserRating={rating.loadingUserRating}
              commentDraft={rating.commentDraft}
              userComment={rating.userComment}
              moderationError={rating.moderationError}
              savingComment={rating.savingComment}
              comments={rating.comments}
              onRate={rating.handleRate}
              onCommentDraftChange={rating.setCommentDraft}
              onSaveComment={rating.handleSaveComment}
            />
          </div>
        </div>
      )}
    </div>
  )
}
