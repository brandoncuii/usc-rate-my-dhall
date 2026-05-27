export interface DiningHall {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Station {
  id: string
  dining_hall_id: string
  name: string
  slug: string
  created_at: string
}

export interface MenuItem {
  id: string
  station_id: string
  name: string
  last_served_date: string
  meal_period: 'breakfast' | 'brunch' | 'lunch' | 'dinner'
  dietary_tags: string[]
  allergens: string[]
  ingredients: string[]
  created_at: string
}

export interface Rating {
  id: string
  menu_item_id: string
  user_id: string
  score: number
  comment: string | null
  created_at: string
  updated_at: string
}

export interface MenuItemWithRating {
  id: string
  name: string
  ingredients: string[]
  station: {
    name: string
    dining_hall: {
      name: string
      slug: string
    }
  }
  averageRating: number
  ratingCount: number
}

export interface MenuItemWithDate extends MenuItemWithRating {
  last_served_date: string
}
