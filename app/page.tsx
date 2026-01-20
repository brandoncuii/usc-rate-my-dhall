import { supabase } from '@/lib/supabase'
import DishCard from './components/DishCard'
import UserNav from './components/UserNav'

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
}

const DINING_HALLS = [
  { slug: 'village', name: 'USC Village', station: 'Expo' },
  { slug: 'parkside', name: 'Parkside', station: 'Bistro' },
  { slug: 'evk', name: "Everybody's Kitchen", station: 'Hot Line' },
]

export default async function Home() {
  const today = new Date().toISOString().split('T')[0]

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
    .eq('date', today)
    .in('meal_period', ['lunch', 'dinner'])

  if (error) {
    return <div className="p-8 text-red-600">Error loading menu: {error.message}</div>
  }

  // Group by dining hall and meal period
  const menuByHall: Record<string, Record<string, MenuItem[]>> = {}

  DINING_HALLS.forEach(hall => {
    menuByHall[hall.slug] = { lunch: [], dinner: [] }
  })

  menuItems?.forEach((item: any) => {
    const hallSlug = item.station?.dining_hall?.slug
    if (hallSlug && menuByHall[hallSlug]) {
      menuByHall[hallSlug][item.meal_period]?.push(item)
    }
  })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#990000] text-white py-6 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">USC Dining</h1>
            <UserNav />
          </div>
          <p className="text-white/80">
            Today's Featured Dishes • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {DINING_HALLS.map(hall => {
          const hallMenu = menuByHall[hall.slug]
          const hasItems = hallMenu.lunch.length > 0 || hallMenu.dinner.length > 0

          return (
            <section key={hall.slug} className="mb-10">
              <div className="flex items-baseline gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-800">{hall.name}</h2>
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
                            name={item.name}
                            ingredients={item.ingredients || []}
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
                            name={item.name}
                            ingredients={item.ingredients || []}
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

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
          <p>Data from USC Hospitality • Click a dish to see ingredients</p>
        </div>
      </div>
    </main>
  )
}
