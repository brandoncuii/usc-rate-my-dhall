'use client'

import { useAuth } from './AuthProvider'
import { useRating } from '../hooks/useRating'
import StarRating from './StarRating'
import CommentSection from './CommentSection'

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
  ratingCount: initialCount,
}: DishCardProps) {
  const { user } = useAuth()
  const rating = useRating({
    menuItemId,
    user,
    initialAvgRating,
    initialCount,
  })

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-800 text-lg mb-2">{name}</h3>
      <div className="mb-3">
        <StarRating rating={rating.averageRating} count={rating.ratingCount} size="sm" />
      </div>

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
  )
}
