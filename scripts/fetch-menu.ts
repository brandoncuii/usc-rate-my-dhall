import { chromium, Browser } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { scrapeAllDiningHalls } from './scraper/scrape'
import { insertDishes } from './db/upsert-dishes'

dotenv.config({ path: '.env.local' })

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
