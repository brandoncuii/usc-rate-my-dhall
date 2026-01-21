import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DishCard from './components/DishCard'
import UserNav from './components/UserNav'

// Disable caching so ratings update on refresh
export const dynamic = 'force-dynamic'

interface MenuItem {
  id: string
  name: string
  ingredients: string[]
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
  { slug: 'village', name: 'USC Village', station: 'Expo' },
  { slug: 'parkside', name: 'Parkside', station: 'Bistro' },
  { slug: 'evk', name: "Everybody's Kitchen", station: 'Bar of the Day' },
]

export default async function Home() {
  // Use local date to avoid timezone issues (toISOString converts to UTC)
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Fetch all menu items for today with station and dining hall info
  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select(`
      id,
      name,
      ingredients,
      station:stations(
        name,
        dining_hall:dining_halls(name, slug)
      )
    `)
    .eq('last_served_date', today)

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#990000] text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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

      {/* Date Subheader */}
      <div className="bg-gray-100 border-b px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 text-sm">
            Today's Featured Dishes • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {DINING_HALLS.map(hall => {
          const hallItems = menuByHall[hall.slug]

          return (
            <section key={hall.slug} className="mb-10">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{hall.name}</h2>
                <span className="text-sm text-[#990000] font-medium">{hall.station}</span>
              </div>

              {hallItems.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No featured dishes today</p>
              ) : (
                <div className="space-y-3">
                  {hallItems.map(item => (
                    <DishCard
                      key={item.id}
                      menuItemId={item.id}
                      name={item.name}
                      ingredients={item.ingredients || []}
                      averageRating={item.averageRating}
                      ratingCount={item.ratingCount}
                    />
                  ))}
                </div>
              )}
            </section>
          )
        })}

        {/* Footer */}
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>Data from USC Hospitality • Click a dish to rate it</p>
        </div>
      </div>
    </main>
  )
}
