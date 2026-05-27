import { supabase } from '@/lib/supabase'
import { fetchRatingStats } from '@/lib/ratings'
import { MenuItemWithRating } from '@/lib/types'
import DishCard from './components/DishCard'
import Header from './components/Header'

export const dynamic = 'force-dynamic'

const DINING_HALLS = [
  { slug: 'village', name: 'USC Village', station: 'Expo' },
  { slug: 'parkside', name: 'Parkside', station: 'Bistro' },
  { slug: 'evk', name: "Everybody's Kitchen", station: 'Bar of the Day' },
]

function getPacificToday(): string {
  const now = new Date()
  const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  return `${pacificDate.getFullYear()}-${String(pacificDate.getMonth() + 1).padStart(2, '0')}-${String(pacificDate.getDate()).padStart(2, '0')}`
}

export default async function Home() {
  const today = getPacificToday()

  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select(
      `
      id,
      name,
      ingredients,
      station:stations(
        name,
        dining_hall:dining_halls(name, slug)
      )
    `,
    )
    .eq('last_served_date', today)

  if (error) {
    return <div className="p-8 text-red-600">Error loading menu: {error.message}</div>
  }

  const menuItemIds = menuItems?.map((item) => item.id) || []
  const ratingStats = await fetchRatingStats(supabase, menuItemIds)

  const menuItemsWithRatings: MenuItemWithRating[] =
    menuItems?.map((item) => {
      const station = item.station as unknown as MenuItemWithRating['station']
      const stats = ratingStats[item.id]
      return {
        id: item.id,
        name: item.name,
        ingredients: (item.ingredients as string[]) || [],
        station,
        averageRating: stats?.avgRating || 0,
        ratingCount: stats?.count || 0,
      }
    }) || []

  const menuByHall: Record<string, MenuItemWithRating[]> = {}
  DINING_HALLS.forEach((hall) => {
    menuByHall[hall.slug] = []
  })

  menuItemsWithRatings.forEach((item) => {
    const hallSlug = item.station?.dining_hall?.slug
    if (hallSlug && menuByHall[hallSlug]) {
      menuByHall[hallSlug].push(item)
    }
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gray-100 border-b px-6 py-3">
        <p className="text-gray-700 text-lg font-medium">
          Today&apos;s Featured Dishes &bull;{' '}
          {new Date().toLocaleDateString('en-US', {
            timeZone: 'America/Los_Angeles',
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DINING_HALLS.map((hall) => {
            const hallItems = menuByHall[hall.slug]

            return (
              <section key={hall.slug} className="min-h-0">
                <div className="mb-4 pb-2 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-800">{hall.name}</h2>
                  <span className="text-sm text-[#990000] font-medium">{hall.station}</span>
                </div>

                {hallItems.length === 0 ? (
                  <p className="text-gray-500 text-sm italic">No featured dishes today</p>
                ) : (
                  <div className="space-y-4">
                    {hallItems.map((item) => (
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
        </div>

        <div className="mt-8 pt-4 border-t text-center text-gray-500 text-sm">
          <p>Data from USC Hospitality</p>
        </div>
      </div>
    </main>
  )
}
