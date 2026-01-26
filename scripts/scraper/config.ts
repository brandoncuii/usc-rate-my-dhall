export interface DiningHallConfig {
  name: string
  slug: string
  tabName: string
  stationName: string
  stationSlug: string
}

export interface ScrapedDish {
  diningHall: string
  station: string
  dishName: string
  ingredients: string[]
  mealPeriod: string
}

export const MENU_URL = 'https://hospitality.usc.edu/dining-hall-menus/'

export const DINING_HALLS: DiningHallConfig[] = [
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
    tabName: "Everybody",
    stationName: 'BAR',
    stationSlug: 'bar-of-the-day'
  }
]

export const STATION_NAMES = [
  'EXPO', 'BISTRO', 'FLAME', 'GLOBAL', 'GRILL', 'HOME', 'PIZZA', 'SOUP',
  'SALAD', 'DELI', 'BAKERY', 'BEVERAGE', 'DESSERT', 'FRESH', 'HOT LINE',
  'MADE TO ORDER', 'GRIDDLE', 'WHOLESOME', 'SIMMER', 'ACTION', 'PLANT BASED',
  'CHEF TABLE', "CHEF'S TABLE", 'MONGOLIAN', 'WOK', 'TAQUERIA', 'COMFORT',
  'HARVEST', 'ROOTS', 'WORLD', 'CUCINA', 'STEAM', 'FIRED', 'CRAFT',
  'FLEXITARIAN', 'CREPES', 'SALAD BAR', 'DELI BAR', 'BREAKFAST/DESSERT/FRUIT',
  'FRESH FROM THE FARM', 'QUESADILLA BAR', 'EURASIA'
]

export const MEAL_PERIODS = ['Breakfast', 'Lunch', 'Dinner']

export const SKIP_PATTERNS = [
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

export const DEBUG = process.env.DEBUG === 'true'
