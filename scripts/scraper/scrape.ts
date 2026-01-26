import { Page } from 'playwright'
import { DiningHallConfig, ScrapedDish, MENU_URL, DINING_HALLS, DEBUG } from './config'
import { parseMenuText } from './parser'
import { setDateToToday } from './date-picker'

export async function scrapeDiningHall(page: Page, config: DiningHallConfig): Promise<ScrapedDish[]> {
  console.log(`\n========== ${config.name} ==========`)

  // Click on dining hall tab
  try {
    await page.click(`text=${config.tabName}`)
    await page.waitForTimeout(2500)
  } catch (e) {
    console.log(`Could not click ${config.tabName} tab`)
    return []
  }

  // Get page text and split into lines
  const pageText = await page.evaluate(() => document.body.innerText)
  const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  // Debug logging for key sections
  if (DEBUG && (config.slug === 'village' || config.slug === 'evk')) {
    console.log(`\n[DEBUG ${config.slug}] Looking for key sections:`)
    lines.forEach((line, idx) => {
      const upper = line.toUpperCase()
      if (upper.includes('EXPO') || upper.includes('BAR') || upper === 'LUNCH' || upper === 'DINNER') {
        console.log(`  [${idx}] ${line}`)
      }
    })
  }

  return parseMenuText(lines, config)
}

export async function scrapeAllDiningHalls(page: Page): Promise<ScrapedDish[]> {
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
