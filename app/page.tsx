import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import DishCard from './components/DishCard'
import UserNav from './components/UserNav'

// Disable caching so ratings update on refresh
export const dynamic = 'force-dynamic'

interface MenuItem {
  id: string
  name: string
  meal_period: string
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
      meal_period,
      ingredients,
      station:stations(
        name,
        dining_hall:dining_halls(name, slug)
      )
    `)
    .eq('last_served_date', today)
    .in('meal_period', ['lunch', 'dinner'])

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

  // Group by dining hall and meal period
  const menuByHall: Record<string, Record<string, MenuItem[]>> = {}

  DINING_HALLS.forEach(hall => {
    menuByHall[hall.slug] = { lunch: [], dinner: [] }
  })

  menuItemsWithRatings.forEach((item: any) => {
    const hallSlug = item.station?.dining_hall?.slug
    if (hallSlug && menuByHall[hallSlug]) {
      menuByHall[hallSlug][item.meal_period]?.push(item)
    }
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#990000] text-white py-3 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">USC RateMyPlate</h1>
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
          const hallMenu = menuByHall[hall.slug]
          const hasItems = hallMenu.lunch.length > 0 || hallMenu.dinner.length > 0

          return (
            <section key={hall.slug} className="mb-10">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-2xl font-bold text-gray-800">{hall.name}</h2>
                <span className="text-sm text-[#990000] font-medium">{hall.station}</span>
              </div>

              {!hasItems ? (
                <p className="text-gray-500 text-sm italic">No featured dishes today</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Lunch */}
                  {hallMenu.lunch.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Lunch</h3>
                      <div className="space-y-3">
                        {hallMenu.lunch.map(item => (
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
                    </div>
                  )}

                  {/* Dinner */}
                  {hallMenu.dinner.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Dinner</h3>
                      <div className="space-y-3">
                        {hallMenu.dinner.map(item => (
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
                    </div>
                  )}
                </div>
              )}
            </section>
          )
        })}

        {/* Navigation Links */}
        <div className="mt-8 pt-6 border-t flex justify-center gap-6">
          <Link
            href="/all-menu-items"
            className="text-[#990000] hover:underline font-medium"
          >
            Previous Menu Items
          </Link>
          <Link
            href="/my-ratings"
            className="text-[#990000] hover:underline font-medium"
          >
            My Ratings
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>Data from USC Hospitality • Click a dish to rate it</p>
        </div>
      </div>
    </main>
  )
}
