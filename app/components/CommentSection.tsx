'use client'

import { User } from '@supabase/supabase-js'
import RatingInput from './RatingInput'

interface Comment {
  score: number
  comment: string
}

interface CommentSectionProps {
  user: User | null
  userRating: number | null
  loadingUserRating: boolean
  commentDraft: string
  userComment: string
  moderationError: string
  savingComment: boolean
  comments: Comment[]
  onRate: (score: number) => Promise<void>
  onCommentDraftChange: (value: string) => void
  onSaveComment: () => Promise<void>
}

export default function CommentSection({
  user,
  userRating,
  loadingUserRating,
  commentDraft,
  userComment,
  moderationError,
  savingComment,
  comments,
  onRate,
  onCommentDraftChange,
  onSaveComment,
}: CommentSectionProps) {
  return (
    <>
      <div className="pt-3 border-t border-gray-100">
        {user ? (
          loadingUserRating ? (
            <span className="text-xs text-gray-400">Loading...</span>
          ) : (
            <>
              <RatingInput onRate={onRate} currentRating={userRating || undefined} />
              {userRating !== null && (
                <div className="mt-2">
                  <textarea
                    value={commentDraft}
                    onChange={(e) => onCommentDraftChange(e.target.value)}
                    placeholder="Add a comment..."
                    rows={2}
                    className="w-full text-sm border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#990000] focus:border-[#990000]"
                  />
                  {moderationError && (
                    <p className="text-xs text-red-600 mt-1">{moderationError}</p>
                  )}
                  {commentDraft.trim() !== userComment && (
                    <button
                      onClick={onSaveComment}
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

      {comments.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Comments</p>
          <ul className="space-y-2">
            {comments.map((c, i) => (
              <li key={i} className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg
                      key={s}
                      className={`w-3 h-3 ${s <= c.score ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
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
    </>
  )
}
