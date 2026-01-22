import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import UserNav from '../components/UserNav'
import StarRating from '../components/StarRating'

export const dynamic = 'force-dynamic'

interface MenuItem {
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
  averageRating: number
  ratingCount: number
}

const DINING_HALLS = [
  { slug: 'village', name: 'USC Village' },
  { slug: 'parkside', name: 'Parkside' },
  { slug: 'evk', name: "Everybody's Kitchen" },
]

export default async function PreviousMenuItems() {
  // Use Pacific time (USC's timezone) for consistent date across all servers
  const now = new Date()
  const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  const today = `${pacificDate.getFullYear()}-${String(pacificDate.getMonth() + 1).padStart(2, '0')}-${String(pacificDate.getDate()).padStart(2, '0')}`

  // Fetch previous menu items (before today) with station and dining hall info
  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      last_served_date,
      station:stations(
        name,
        dining_hall:dining_halls(name, slug)
      )
    `)
    .lt('last_served_date', today)
    .order('name', { ascending: true })

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

  // Sort each hall's items alphabetically by name
  Object.keys(menuByHall).forEach(slug => {
    menuByHall[slug].sort((a, b) => a.name.localeCompare(b.name))
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

          return (
            <section key={hall.slug} className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b">
                {hall.name}
              </h2>

              {hallItems.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No previous menu items found</p>
              ) : (
                <div className="space-y-2">
                  {hallItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex items-center justify-between"
                    >
                      <span className="font-medium text-gray-800">{item.name}</span>
                      <StarRating rating={item.averageRating} count={item.ratingCount} size="sm" />
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
