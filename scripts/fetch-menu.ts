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
    stationName: 'BAR',  // Look for sections ending in "BAR" (e.g., QUESADILLA BAR)
    stationSlug: 'bar-of-the-day'
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
        // For EVK, look for sections ending in "BAR" (e.g., QUESADILLA BAR, TACO BAR)
        // Exclude "SALAD AND DELI BAR" and breakfast bars
        const isBarSection = upperLine.endsWith(' BAR') || upperLine === 'BAR'
        const isExcludedBar = upperLine.includes('SALAD') || upperLine.includes('DELI') ||
                              upperLine.includes('WAFFLE') || upperLine.includes('BREAKFAST')
        inTargetStation = isBarSection && !isExcludedBar
        if (inTargetStation) {
          // The section name IS the dish name for EVK
          currentDish = { name: line, ingredients: [] }
          foundDishName = true
          console.log(`Found EVK bar: ${line}`)
        } else {
          foundDishName = false
        }
      } else {
        inTargetStation = upperLine.includes(config.stationName)
        foundDishName = false
        if (inTargetStation) {
          console.log(`Found ${config.stationName} station`)
        }
      }
      continue
    }

    // If we're in target station and it's lunch or dinner, capture dish and ingredients
    if (inTargetStation && currentMeal && (currentMeal === 'lunch' || currentMeal === 'dinner')) {
      // Skip filter/UI items and footer text
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

      // For Village and Parkside, first non-station line after EXPO/BISTRO is the dish name
      // (EVK already sets the dish name when finding the BAR section)
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

async function setDateToToday(page: Page): Promise<void> {
  const today = new Date()
  const month = today.toLocaleString('en-US', { month: 'long' })
  const day = today.getDate()
  const year = today.getFullYear()
  const todayFormatted = `${month} ${day}, ${year}`

  console.log(`Setting date picker to today: ${todayFormatted}`)

  try {
    // Look for date picker input or button - USC Hospitality uses various date picker implementations
    // Try clicking on the date display/input to open the picker
    const dateSelector = await page.$('input[type="date"], .date-picker, .datepicker, [data-date], .menu-date-selector, input[name*="date"], button:has-text("Select Date"), .date-nav')

    if (dateSelector) {
      await dateSelector.click()
      await page.waitForTimeout(500)
    }

    // Try to find and click a "Today" button if it exists
    const todayButton = await page.$('button:has-text("Today"), a:has-text("Today"), .today-btn, .ui-datepicker-today')
    if (todayButton) {
      await todayButton.click()
      console.log('Clicked "Today" button')
      await page.waitForTimeout(1500)
      return
    }

    // Try to find date navigation arrows and navigate to today
    // First, check if current displayed date matches today
    const pageText = await page.evaluate(() => document.body.innerText)

    // Check if today's date is already displayed
    const datePatterns = [
      todayFormatted,
      `${month} ${day}`,
      today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      today.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    ]

    const dateAlreadySet = datePatterns.some(pattern => pageText.includes(pattern))

    if (dateAlreadySet) {
      console.log('Date is already set to today')
      return
    }

    // Look for left/previous arrow to go back if showing future date
    // The site might show tomorrow's date later in the day
    const prevButton = await page.$('button[aria-label*="previous"], button[aria-label*="Previous"], .prev-date, .date-prev, [class*="prev"], [class*="left-arrow"], button:has-text("<"), button:has-text("‹"), .slick-prev')

    if (prevButton) {
      // Click previous up to 7 times to find today
      for (let i = 0; i < 7; i++) {
        await prevButton.click()
        await page.waitForTimeout(1000)

        const updatedText = await page.evaluate(() => document.body.innerText)
        const foundToday = datePatterns.some(pattern => updatedText.includes(pattern))

        if (foundToday) {
          console.log(`Found today's date after ${i + 1} click(s)`)
          return
        }
      }
    }

    // Alternative: Try using keyboard to navigate date input
    const dateInput = await page.$('input[type="date"]')
    if (dateInput) {
      const isoDate = today.toISOString().split('T')[0] // YYYY-MM-DD format
      await dateInput.fill(isoDate)
      await page.waitForTimeout(1000)
      console.log(`Set date input to ${isoDate}`)
      return
    }

    console.log('Could not find date picker controls, proceeding with displayed date')

  } catch (error) {
    console.log('Error interacting with date picker:', error)
    console.log('Proceeding with current page state')
  }
}

async function scrapeAllDiningHalls(page: Page): Promise<ScrapedDish[]> {
  console.log('Navigating to menu page...')
  await page.goto(MENU_URL, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(3000)

  // Ensure the date picker is set to today's date
  await setDateToToday(page)
  await page.waitForTimeout(1500)

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

    console.log(`${hallConfig.name}: upserted ${inserted} dishes`)
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
