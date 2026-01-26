import { SupabaseClient } from '@supabase/supabase-js'
import { DiningHallConfig, ScrapedDish, DINING_HALLS } from '../scraper/config'
import { getPacificDateISO } from '../utils/date'

async function getOrCreateStation(
  supabase: SupabaseClient,
  hallId: string,
  config: DiningHallConfig
): Promise<string | null> {
  // Try to get existing station
  const { data: station } = await supabase
    .from('stations')
    .select('id')
    .eq('dining_hall_id', hallId)
    .eq('slug', config.stationSlug)
    .single()

  if (station) return station.id

  // Create new station
  const { data: newStation, error } = await supabase
    .from('stations')
    .insert({
      dining_hall_id: hallId,
      name: config.stationName,
      slug: config.stationSlug
    })
    .select('id')
    .single()

  if (error) {
    console.log(`Failed to create station: ${error.message}`)
    return null
  }

  console.log(`Created ${config.stationName} station for ${config.slug}`)
  return newStation.id
}

function deduplicateDishes(dishes: ScrapedDish[]): ScrapedDish[] {
  const uniqueDishes = new Map<string, ScrapedDish>()
  dishes.forEach(dish => {
    // Keep the first occurrence (lunch takes priority over dinner)
    if (!uniqueDishes.has(dish.dishName)) {
      uniqueDishes.set(dish.dishName, dish)
    }
  })
  return Array.from(uniqueDishes.values())
}

export async function insertDishes(supabase: SupabaseClient, dishes: ScrapedDish[]): Promise<void> {
  const today = getPacificDateISO()

  console.log('\n========== INSERTING INTO DATABASE ==========')
  console.log('Using upsert to preserve existing menu item IDs and ratings')

  for (const hallConfig of DINING_HALLS) {
    // Get dining hall ID
    const { data: hall } = await supabase
      .from('dining_halls')
      .select('id')
      .eq('slug', hallConfig.slug)
      .single()

    if (!hall) {
      console.log(`Dining hall ${hallConfig.slug} not found`)
      continue
    }

    // Get or create station
    const stationId = await getOrCreateStation(supabase, hall.id, hallConfig)
    if (!stationId) continue

    // Get unique dishes for this dining hall
    const hallDishes = dishes.filter(d => d.diningHall === hallConfig.slug)
    const uniqueDishes = deduplicateDishes(hallDishes)

    let inserted = 0

    for (const dish of uniqueDishes) {
      const { error } = await supabase
        .from('menu_items')
        .upsert({
          station_id: stationId,
          name: dish.dishName,
          last_served_date: today,
          meal_period: 'lunch',
          dietary_tags: [],
          allergens: [],
          ingredients: dish.ingredients
        }, {
          onConflict: 'station_id,name,meal_period'
        })

      if (error) {
        console.log(`Failed to insert ${dish.dishName}: ${error.message}`)
      } else {
        inserted++
      }
    }

    console.log(`${hallConfig.name}: upserted ${inserted} dishes`)
  }
}
