import {
  DiningHallConfig,
  ScrapedDish,
  STATION_NAMES,
  MEAL_PERIODS,
  SKIP_PATTERNS,
  DEBUG
} from './config'

interface ParseState {
  currentMeal: string | null
  inTargetStation: boolean
  currentDish: { name: string; ingredients: string[] } | null
  foundDishName: boolean
}

function createDish(config: DiningHallConfig, state: ParseState): ScrapedDish | null {
  if (!state.currentDish || !state.currentMeal) return null
  if (state.currentMeal !== 'lunch' && state.currentMeal !== 'dinner') return null

  return {
    diningHall: config.slug,
    station: config.stationSlug,
    dishName: state.currentDish.name,
    ingredients: state.currentDish.ingredients,
    mealPeriod: state.currentMeal
  }
}

function isStationHeader(line: string, upperLine: string, config: DiningHallConfig): boolean {
  const isAllCaps = line === upperLine
  if (!isAllCaps) return false

  const matchesKnownStation = STATION_NAMES.some(s => upperLine === s || upperLine.startsWith(s + ' '))
  const isEvkBar = config.slug === 'evk' && upperLine.endsWith(' BAR')

  return matchesKnownStation || isEvkBar
}

function shouldSkipLine(line: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(line))
}

function isTargetStation(upperLine: string, config: DiningHallConfig): { isTarget: boolean; isEvkBar: boolean } {
  if (config.slug === 'evk') {
    const isBarSection = upperLine.endsWith(' BAR') || upperLine === 'BAR'
    const isExcludedBar = upperLine.includes('SALAD') || upperLine.includes('DELI') ||
                          upperLine.includes('WAFFLE') || upperLine.includes('BREAKFAST')
    return { isTarget: isBarSection && !isExcludedBar, isEvkBar: true }
  }
  return { isTarget: upperLine === config.stationName, isEvkBar: false }
}

export function parseMenuText(lines: string[], config: DiningHallConfig): ScrapedDish[] {
  const dishes: ScrapedDish[] = []
  const state: ParseState = {
    currentMeal: null,
    inTargetStation: false,
    currentDish: null,
    foundDishName: false
  }

  for (const line of lines) {
    const upperLine = line.toUpperCase()

    // Check for meal period header
    if (MEAL_PERIODS.includes(line)) {
      const dish = createDish(config, state)
      if (dish) dishes.push(dish)

      state.currentMeal = line.toLowerCase()
      state.inTargetStation = false
      state.currentDish = null
      state.foundDishName = false

      if (DEBUG) console.log(`\n--- ${state.currentMeal.toUpperCase()} ---`)
      continue
    }

    // Check if this line is a station header
    if (isStationHeader(line, upperLine, config)) {
      const dish = createDish(config, state)
      if (dish) dishes.push(dish)
      state.currentDish = null

      const { isTarget, isEvkBar } = isTargetStation(upperLine, config)
      state.inTargetStation = isTarget

      if (isTarget && isEvkBar) {
        // For EVK, the section name IS the dish name
        state.currentDish = { name: line, ingredients: [] }
        state.foundDishName = true
        if (DEBUG) console.log(`Found EVK bar: ${line}`)
      } else if (isTarget) {
        state.foundDishName = false
        if (DEBUG) console.log(`Found ${config.stationName} station`)
      } else {
        state.foundDishName = false
      }
      continue
    }

    // If we're in target station and it's lunch or dinner, capture dish and ingredients
    if (!state.inTargetStation) continue
    if (!state.currentMeal || (state.currentMeal !== 'lunch' && state.currentMeal !== 'dinner')) continue
    if (shouldSkipLine(line)) continue

    // First non-station line after EXPO/BISTRO is the dish name (EVK already has it)
    if (!state.foundDishName && line.length > 3 && line.length < 60) {
      const looksLikeDishName = line !== upperLine || line.includes(' ')
      if (looksLikeDishName) {
        const dish = createDish(config, state)
        if (dish) dishes.push(dish)

        state.currentDish = { name: line, ingredients: [] }
        state.foundDishName = true
        if (DEBUG) console.log(`  Dish: ${line}`)
        continue
      }
    }

    // Add ingredients to current dish
    if (state.currentDish && state.foundDishName && line.length >= 3 && line.length < 80) {
      state.currentDish.ingredients.push(line)
      if (DEBUG) console.log(`    - ${line}`)
    }
  }

  // Save last dish
  const lastDish = createDish(config, state)
  if (lastDish) dishes.push(lastDish)

  return dishes
}
