import { supabase } from '@/lib/supabase'
import { fetchRatingStats } from '@/lib/ratings'
import { MenuItemWithDate } from '@/lib/types'
import Header from '../components/Header'
import PreviousItemCard from '../components/PreviousItemCard'

export const dynamic = 'force-dynamic'

const DINING_HALLS = [
  { slug: 'village', name: 'USC Village' },
  { slug: 'parkside', name: 'Parkside' },
  { slug: 'evk', name: "Everybody's Kitchen" },
]

function getPacificToday(): string {
  const now = new Date()
  const pacificDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }))
  return `${pacificDate.getFullYear()}-${String(pacificDate.getMonth() + 1).padStart(2, '0')}-${String(pacificDate.getDate()).padStart(2, '0')}`
}

export default async function PreviousMenuItems() {
  const today = getPacificToday()

  const { data: menuItems, error } = await supabase
    .from('menu_items')
    .select(
      `
      id,
      name,
      ingredients,
      last_served_date,
      station:stations(
        name,
        dining_hall:dining_halls(name, slug)
      )
    `,
    )
    .lt('last_served_date', today)
    .order('name', { ascending: true })

  if (error) {
    return <div className="p-8 text-red-600">Error loading menu: {error.message}</div>
  }

  const menuItemIds = menuItems?.map((item) => item.id) || []
  const ratingStats = await fetchRatingStats(supabase, menuItemIds)

  const menuItemsWithRatings: MenuItemWithDate[] =
    menuItems?.map((item) => {
      const station = item.station as unknown as MenuItemWithDate['station']
      const stats = ratingStats[item.id]
      return {
        id: item.id,
        name: item.name,
        ingredients: (item.ingredients as string[]) || [],
        last_served_date: item.last_served_date,
        station,
        averageRating: stats?.avgRating || 0,
        ratingCount: stats?.count || 0,
      }
    }) || []

  const menuByHall: Record<string, MenuItemWithDate[]> = {}
  DINING_HALLS.forEach((hall) => {
    menuByHall[hall.slug] = []
  })

  menuItemsWithRatings.forEach((item) => {
    const hallSlug = item.station?.dining_hall?.slug
    if (hallSlug && menuByHall[hallSlug]) {
      menuByHall[hallSlug].push(item)
    }
  })

  Object.keys(menuByHall).forEach((slug) => {
    menuByHall[slug].sort((a, b) => a.name.localeCompare(b.name))
  })

  return (
    <main className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gray-100 border-b px-6 py-2">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600 text-sm">
            Previous Menu Items &bull; Past dishes and their ratings
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {DINING_HALLS.map((hall) => {
          const hallItems = menuByHall[hall.slug]

          return (
            <section key={hall.slug} className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 pb-2 border-b">{hall.name}</h2>

              {hallItems.length === 0 ? (
                <p className="text-gray-500 text-sm italic">No previous menu items found</p>
              ) : (
                <div className="space-y-2">
                  {hallItems.map((item) => (
                    <PreviousItemCard
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

        <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
          <p>Data from USC Hospitality &bull; Click a dish to rate it</p>
        </div>
      </div>
    </main>
  )
}
