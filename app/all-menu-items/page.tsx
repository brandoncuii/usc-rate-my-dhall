import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import UserNav from '../components/UserNav'
import StarRating from '../components/StarRating'

export const dynamic = 'force-dynamic'

interface MenuItem {
  id: string
  name: string
  last_served_date: string
  meal_period: string
  station: {
    name: string
    dining_hall: {
      name: string
      slug: string
    }
  }
  averageRating: number
  ratingCount: number
}

const DINING_HALLS = [
  { slug: 'village', name: 'USC Village' },
  { slug: 'parkside', name: 'Parkside' },
  { slug: 'evk', name: "Everybody's Kitchen" },
]

export default async function PreviousMenuItems() {
  // Use local date to avoid timezone issues (toISOString converts to UTC)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Fetch previous menu items (before today) with station and dining hall info
  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      last_served_date,
      meal_period,
      station:stations(
        name,
        dining_hall:dining_halls(name, slug)
      )
    `)
    .lt('last_served_date', today)
    .order('last_served_date', { ascending: false })

  if (error) {
    return <div className="p-8 text-red-600">Error loading menu: {error.message}</div>
  }

  // Fetch ratings for all menu items
  const menuItemIds = menuItems?.map(item => item.id) || []
  const { data: ratings } = await supabase
    .from('ratings')
    .select('menu_item_id, score')
    .in('menu_item_id', menuItemIds)

  // Calculate average ratings and counts for each menu item
  const ratingStats: Record<string, { total: number; count: number }> = {}
  ratings?.forEach(rating => {
    if (!ratingStats[rating.menu_item_id]) {
      ratingStats[rating.menu_item_id] = { total: 0, count: 0 }
    }
    ratingStats[rating.menu_item_id].total += rating.score
    ratingStats[rating.menu_item_id].count += 1
  })

  // Add rating data to menu items
  const menuItemsWithRatings = menuItems?.map(item => ({
    ...item,
    averageRating: ratingStats[item.id]
      ? ratingStats[item.id].total / ratingStats[item.id].count
      : 0,
    ratingCount: ratingStats[item.id]?.count || 0
  })) || []

  // Group by dining hall
  const menuByHall: Record<string, MenuItem[]> = {}
  DINING_HALLS.forEach(hall => {
    menuByHall[hall.slug] = []
  })

  menuItemsWithRatings.forEach((item: any) => {
    const hallSlug = item.station?.dining_hall?.slug
    if (hallSlug && menuByHall[hallSlug]) {
      menuByHall[hallSlug].push(item)
    }
  })

  // Sort each hall's items by last_served_date (newest first) then by name
  Object.keys(menuByHall).forEach(slug => {
    menuByHall[slug].sort((a, b) => {
      if (a.last_served_date !== b.last_served_date) return b.last_served_date.localeCompare(a.last_served_date)
      return a.name.localeCompare(b.name)
    })
  })

  // Get unique dates for grouping display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#990000] text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">USC RateMyPlate</h1>
          <UserNav />
        </div>
      </header>

      {/* Subheader */}
      <div className="bg-gray-100 border-b px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 text-sm">Previous Menu Items • Past dishes and their ratings</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="text-[#990000] hover:underline text-sm">
            ← Back to Today's Menu
          </Link>
          <Link href="/my-ratings" className="text-[#990000] hover:underline text-sm">
            My Ratings →
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {DINING_HALLS.map(hall => {
          const hallItems = menuByHall[hall.slug]

          // Group items by last_served_date
          const itemsByDate: Record<string, MenuItem[]> = {}
          hallItems.forEach(item => {
            if (!itemsByDate[item.last_served_date]) {
              itemsByDate[item.last_served_date] = []
            }
            itemsByDate[item.last_served_date].push(item)
          })

          const dates = Object.keys(itemsByDate).sort((a, b) => b.localeCompare(a))

          return (
            <section key={hall.slug} className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b">
                {hall.name}
              </h2>

              {hallItems.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No previous menu items found</p>
              ) : (
                <div className="space-y-6">
                  {dates.map(date => (
                    <div key={date}>
                      <h3 className="text-sm font-semibold text-[#990000] uppercase tracking-wide mb-3">
                        {formatDate(date)}
                      </h3>
                      <div className="space-y-2">
                        {itemsByDate[date].map(item => (
                          <div
                            key={item.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between"
                          >
                            <div>
                              <span className="font-medium text-gray-800">{item.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({item.meal_period})</span>
                            </div>
                            <StarRating rating={item.averageRating} count={item.ratingCount} size="sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )
        })}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
          <p>Data from USC Hospitality • Click a dish to rate it</p>
        </div>
      </div>
    </main>
  )
}
