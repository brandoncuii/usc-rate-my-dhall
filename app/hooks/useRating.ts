'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase-browser'

interface Comment {
  score: number
  comment: string
}

interface UseRatingOptions {
  menuItemId: string
  user: User | null
  initialAvgRating: number
  initialCount: number
  fetchOnMount?: boolean
}

export function useRating({
  menuItemId,
  user,
  initialAvgRating,
  initialCount,
  fetchOnMount = true,
}: UseRatingOptions) {
  const [userRating, setUserRating] = useState<number | null>(null)
  const [userComment, setUserComment] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [averageRating, setAverageRating] = useState(initialAvgRating)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [loadingUserRating, setLoadingUserRating] = useState(false)
  const [savingComment, setSavingComment] = useState(false)
  const [moderationError, setModerationError] = useState('')

  const fetchComments = useCallback(async () => {
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
  }, [menuItemId])

  const fetchUserRating = useCallback(async () => {
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
  }, [user, menuItemId])

  useEffect(() => {
    if (!fetchOnMount) return
    if (user) {
      fetchUserRating()
    }
    fetchComments()
  }, [user, menuItemId, fetchOnMount, fetchUserRating, fetchComments])

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchComments(), user ? fetchUserRating() : Promise.resolve()])
  }, [fetchComments, fetchUserRating, user])

  const handleRate = async (score: number) => {
    if (!user) return

    const { error } = await supabaseBrowser.from('ratings').upsert(
      {
        menu_item_id: menuItemId,
        user_id: user.id,
        score,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'menu_item_id,user_id' },
    )

    if (error) {
      console.error('Rating error:', error.message)
      alert('Failed to save rating: ' + error.message)
      return
    }

    const wasNewRating = userRating === null
    setUserRating(score)

    if (wasNewRating) {
      const newCount = ratingCount + 1
      const newAvg = (averageRating * ratingCount + score) / newCount
      setAverageRating(newAvg)
      setRatingCount(newCount)
    } else {
      const newAvg = (averageRating * ratingCount - (userRating || 0) + score) / ratingCount
      setAverageRating(newAvg)
    }
  }

  const handleSaveComment = async () => {
    if (!user || userRating === null) return
    setSavingComment(true)
    setModerationError('')

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
      }
    }

    const { error } = await supabaseBrowser.from('ratings').upsert(
      {
        menu_item_id: menuItemId,
        user_id: user.id,
        score: userRating,
        comment: commentDraft.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'menu_item_id,user_id' },
    )

    if (!error) {
      setUserComment(commentDraft.trim())
      fetchComments()
    }
    setSavingComment(false)
  }

  return {
    userRating,
    userComment,
    commentDraft,
    setCommentDraft,
    comments,
    averageRating,
    ratingCount,
    loadingUserRating,
    savingComment,
    moderationError,
    handleRate,
    handleSaveComment,
    fetchAll,
  }
}
