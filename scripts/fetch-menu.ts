import { chromium, Browser, Page } from 'playwright'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const MENU_URL = 'https://hospitality.usc.edu/dining-hall-menus/'

interface DiningHallConfig {
  name: string
  slug: string
  tabName: string
  stationName: string  // The station to look for (EXPO, BISTRO, etc.)
  stationSlug: string
}

interface ScrapedDish {
  diningHall: string
  station: string
  dishName: string
  ingredients: string[]
  mealPeriod: string
}

const DINING_HALLS: DiningHallConfig[] = [
  {
    name: 'USC Village Dining Hall',
    slug: 'village',
    tabName: 'USC Village',
    stationName: 'EXPO',
    stationSlug: 'expo'
  },
  {
    name: 'Parkside Restaurant & Grill',
    slug: 'parkside',
    tabName: 'Parkside',
    stationName: 'BISTRO',
    stationSlug: 'bistro'
  },
  {
    name: "Everybody's Kitchen",
    slug: 'evk',
    tabName: "Everybody",  // Just match partial text
    stationName: 'HOT LINE',  // Look for "... Bar" under HOT LINE
    stationSlug: 'hot-line'
  }
]

async function scrapeDiningHall(page: Page, config: DiningHallConfig): Promise<ScrapedDish[]> {
  const dishes: ScrapedDish[] = []

  console.log(`\n========== ${config.name} ==========`)

  // Click on dining hall tab
  try {
    await page.click(`text=${config.tabName}`)
    await page.waitForTimeout(2500)
  } catch (e) {
    console.log(`Could not click ${config.tabName} tab`)
    return dishes
  }

  // Get page text
  const pageText = await page.evaluate(() => document.body.innerText)
  const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Station names to detect section boundaries
  const stationNames = [
    'EXPO', 'BISTRO', 'FLAME', 'GLOBAL', 'GRILL', 'HOME', 'PIZZA', 'SOUP',
    'SALAD', 'DELI', 'BAKERY', 'BEVERAGE', 'DESSERT', 'FRESH', 'HOT LINE',
    'MADE TO ORDER', 'GRIDDLE', 'WHOLESOME', 'SIMMER', 'ACTION', 'PLANT BASED',
    'CHEF TABLE', "CHEF'S TABLE", 'MONGOLIAN', 'WOK', 'TAQUERIA', 'COMFORT',
    'HARVEST', 'ROOTS', 'WORLD', 'CUCINA', 'STEAM', 'FIRED', 'CRAFT',
    'FLEXITARIAN', 'CREPES', 'SALAD BAR', 'DELI BAR', 'BREAKFAST/DESSERT/FRUIT',
    'FRESH FROM THE FARM', 'QUESADILLA BAR'
  ]

  const mealPeriods = ['Breakfast', 'Lunch', 'Dinner']
  let currentMeal: string | null = null
  let inTargetStation = false
  let currentDish: { name: string; ingredients: string[] } | null = null
  let foundDishName = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const upperLine = line.toUpperCase()

    // Check for meal period header
    if (mealPeriods.includes(line)) {
      // Save previous dish if exists
      if (currentDish && currentMeal && (currentMeal === 'lunch' || currentMeal === 'dinner')) {
        dishes.push({
          diningHall: config.slug,
          station: config.stationSlug,
          dishName: currentDish.name,
          ingredients: currentDish.ingredients,
          mealPeriod: currentMeal
        })
      }
      currentMeal = line.toLowerCase()
      inTargetStation = false
      currentDish = null
      foundDishName = false
      console.log(`\n--- ${currentMeal.toUpperCase()} ---`)
      continue
    }

    // Check if this line is a station header
    const isStationHeader = stationNames.some(s => upperLine === s || upperLine.startsWith(s + ' '))

    if (isStationHeader) {
      // Save previous dish if exists
      if (currentDish && currentMeal && (currentMeal === 'lunch' || currentMeal === 'dinner')) {
        dishes.push({
          diningHall: config.slug,
          station: config.stationSlug,
          dishName: currentDish.name,
          ingredients: currentDish.ingredients,
          mealPeriod: currentMeal
        })
        currentDish = null
      }

      // Check if this is our target station
      if (config.slug === 'evk') {
        // For EVK, look for HOT LINE section
        inTargetStation = upperLine.includes('HOT LINE')
      } else {
        inTargetStation = upperLine.includes(config.stationName)
      }

      foundDishName = false
      if (inTargetStation) {
        console.log(`Found ${config.stationName} station`)
      }
      continue
    }

    // If we're in target station and it's lunch or dinner, capture dish and ingredients
    if (inTargetStation && currentMeal && (currentMeal === 'lunch' || currentMeal === 'dinner')) {
      // Skip filter/UI items and footer text
      // Only skip if the line is EXACTLY a filter label (not part of a dish name)
      const skipPatterns = [
        /^dairy$/i, /^eggs$/i, /^fish$/i, /^gluten$/i, /^peanuts$/i,
        /^pork$/i, /^sesame$/i, /^shellfish$/i, /^soy$/i, /^tree nuts$/i,
        /^gluten\/wheat$/i, /^food not analyzed/i,
        /^halal ingredients$/i, /^vegan$/i, /^vegetarian$/i,
        /^(contains|may contain|allergen)/i,
        /^(menu|filter|all|hide|show|view|items|preferences)/i,
        /^(skip to content|search|home)$/i,
        /^(feedback|privacy|copyright|sign up|digital access)/i,
        /^\d+$/,
        /^[•\-\*\s]+$/,
        /©/,
        /^All Menus$/i, /^Breakfast Menu$/i, /^Brunch Menu$/i, /^Lunch Menu$/i, /^Dinner Menu$/i,
      ]

      if (skipPatterns.some(p => p.test(line))) continue

      // For EVK, look for lines ending in "Bar" as the dish name
      if (config.slug === 'evk') {
        if (line.toLowerCase().includes('bar') && !foundDishName) {
          // This is the dish name (e.g., "QUESADILLA BAR")
          if (currentDish) {
            dishes.push({
              diningHall: config.slug,
              station: config.stationSlug,
              dishName: currentDish.name,
              ingredients: currentDish.ingredients,
              mealPeriod: currentMeal
            })
          }
          currentDish = { name: line, ingredients: [] }
          foundDishName = true
          console.log(`  Dish: ${line}`)
          continue
        }
      } else {
        // For Village and Parkside, first non-station line after EXPO/BISTRO is the dish name
        if (!foundDishName && line.length > 3 && line.length < 60) {
          // Check if it looks like a dish name (not all caps, reasonable length)
          const looksLikeDishName = line !== upperLine || line.includes(' ')
          if (looksLikeDishName) {
            if (currentDish) {
              dishes.push({
                diningHall: config.slug,
                station: config.stationSlug,
                dishName: currentDish.name,
                ingredients: currentDish.ingredients,
                mealPeriod: currentMeal
              })
            }
            currentDish = { name: line, ingredients: [] }
            foundDishName = true
            console.log(`  Dish: ${line}`)
            continue
          }
        }
      }

      // If we have a dish, add ingredients
      if (currentDish && foundDishName && line.length >= 3 && line.length < 80) {
        currentDish.ingredients.push(line)
        console.log(`    - ${line}`)
      }
    }
  }

  // Save last dish
  if (currentDish && currentMeal && (currentMeal === 'lunch' || currentMeal === 'dinner')) {
    dishes.push({
      diningHall: config.slug,
      station: config.stationSlug,
      dishName: currentDish.name,
      ingredients: currentDish.ingredients,
      mealPeriod: currentMeal
    })
  }

  return dishes
}

async function scrapeAllDiningHalls(page: Page): Promise<ScrapedDish[]> {
  console.log('Navigating to menu page...')
  await page.goto(MENU_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)

  const allDishes: ScrapedDish[] = []

  for (const config of DINING_HALLS) {
    const dishes = await scrapeDiningHall(page, config)
    allDishes.push(...dishes)
  }

  return allDishes
}

async function insertDishes(supabase: SupabaseClient, dishes: ScrapedDish[]): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  console.log('\n========== INSERTING INTO DATABASE ==========')

  // First, clear ALL menu items for today to avoid duplicates
  const { error: clearError } = await supabase
    .from('menu_items')
    .delete()
    .eq('date', today)

  if (clearError) {
    console.log('Warning: Could not clear old items:', clearError.message)
  } else {
    console.log('Cleared all menu items for today')
  }

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
    let { data: station } = await supabase
      .from('stations')
      .select('id')
      .eq('dining_hall_id', hall.id)
      .eq('slug', hallConfig.stationSlug)
      .single()

    if (!station) {
      const { data: newStation, error } = await supabase
        .from('stations')
        .insert({
          dining_hall_id: hall.id,
          name: hallConfig.stationName,
          slug: hallConfig.stationSlug
        })
        .select('id')
        .single()

      if (error) {
        console.log(`Failed to create station: ${error.message}`)
        continue
      }
      station = newStation
      console.log(`Created ${hallConfig.stationName} station for ${hallConfig.slug}`)
    }

    // Insert dishes for this dining hall
    const hallDishes = dishes.filter(d => d.diningHall === hallConfig.slug)
    let inserted = 0

    for (const dish of hallDishes) {
      const { error } = await supabase
        .from('menu_items')
        .upsert({
          station_id: station.id,
          name: dish.dishName,
          date: today,
          meal_period: dish.mealPeriod,
          dietary_tags: [],
          allergens: [],
          ingredients: dish.ingredients
        }, {
          onConflict: 'station_id,name,date,meal_period'
        })

      if (error) {
        console.log(`Failed to insert ${dish.dishName}: ${error.message}`)
      } else {
        inserted++
      }
    }

    console.log(`${hallConfig.name}: inserted ${inserted} dishes`)
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  let browser: Browser | null = null

  try {
    console.log('Launching browser...\n')
    browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    const dishes = await scrapeAllDiningHalls(page)

    console.log(`\n========== SUMMARY ==========`)
    console.log(`Total dishes scraped: ${dishes.length}`)
    dishes.forEach(d => {
      console.log(`  ${d.diningHall} - ${d.mealPeriod}: ${d.dishName} (${d.ingredients.length} ingredients)`)
    })

    if (dishes.length > 0) {
      await insertDishes(supabase, dishes)
    }

    console.log('\nDone!')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  } finally {
    if (browser) await browser.close()
  }
}

main()
