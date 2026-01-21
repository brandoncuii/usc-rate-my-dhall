'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../components/AuthProvider'
import { supabaseBrowser } from '@/lib/supabase-browser'
import Link from 'next/link'
import UserNav from '../components/UserNav'
import StarRating from '../components/StarRating'

interface RatingWithDish {
  id: string
  score: number
  created_at: string
  updated_at: string
  menu_item: {
    id: string
    name: string
    last_served_date: string
    station: {
      name: string
      dining_hall: {
        name: string
        slug: string
      }
    }
  }
}

export default function MyRatings() {
  const { user, loading: authLoading } = useAuth()
  const [ratings, setRatings] = useState<RatingWithDish[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMyRatings()
    } else if (!authLoading) {
      setLoading(false)
    }
  }, [user, authLoading])

  const fetchMyRatings = async () => {
    if (!user) return

    const { data, error } = await supabaseBrowser
      .from('ratings')
      .select(`
        id,
        score,
        created_at,
        updated_at,
        menu_item:menu_items(
          id,
          name,
          last_served_date,
          station:stations(
            name,
            dining_hall:dining_halls(name, slug)
          )
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching ratings:', error.message)
    } else {
      setRatings(data as unknown as RatingWithDish[] || [])
    }
    setLoading(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Group ratings by dining hall
  const ratingsByHall: Record<string, RatingWithDish[]> = {}
  ratings.forEach(rating => {
    const hallName = rating.menu_item?.station?.dining_hall?.name || 'Unknown'
    if (!ratingsByHall[hallName]) {
      ratingsByHall[hallName] = []
    }
    ratingsByHall[hallName].push(rating)
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#990000] text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold hover:text-white/90 transition-colors">
              USC RateMyPlate
            </Link>
            <span className="text-white/40">|</span>
            <Link href="/all-menu-items" className="text-sm text-white hover:text-white/80 underline underline-offset-2 transition-colors">
              Previous Menu Items
            </Link>
            <Link href="/my-ratings" className="text-sm text-white hover:text-white/80 underline underline-offset-2 transition-colors">
              My Ratings
            </Link>
          </div>
          <UserNav />
        </div>
      </header>

      {/* Subheader */}
      <div className="bg-gray-100 border-b px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 text-sm">My Ratings • Your rating history across all dining halls</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-[#990000] hover:underline text-sm">
            ← Back to Today's Menu
          </Link>
          <Link href="/all-menu-items" className="text-[#990000] hover:underline text-sm">
            Previous Menu Items →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {authLoading || loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : !user ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Sign in to view your rating history</p>
            <Link
              href="/"
              className="text-[#990000] hover:underline font-medium"
            >
              Go to Home to Sign In
            </Link>
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't rated any dishes yet</p>
            <Link
              href="/"
              className="text-[#990000] hover:underline font-medium"
            >
              Browse Today's Menu
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sm text-gray-600">
              Total ratings: <span className="font-semibold">{ratings.length}</span>
            </div>

            {Object.entries(ratingsByHall).map(([hallName, hallRatings]) => (
              <section key={hallName} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b">
                  {hallName}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({hallRatings.length} ratings)
                  </span>
                </h2>

                <div className="space-y-3">
                  {hallRatings.map(rating => (
                    <div
                      key={rating.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-800">
                            {rating.menu_item?.name || 'Unknown Dish'}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <StarRating rating={rating.score} size="sm" />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {rating.menu_item?.station?.name}
                          </p>
                        </div>
                        <div className="text-right text-xs text-gray-400">
                          <p>Last served: {rating.menu_item?.last_served_date ? formatDate(rating.menu_item.last_served_date + 'T00:00:00') : 'N/A'}</p>
                          <p>Rated: {formatTimestamp(rating.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
          <p>USC RateMyPlate • Your personal rating history</p>
        </div>
      </div>
    </main>
  )
}
