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
  date: string
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
  score: number // 1-5
  comment: string | null
  created_at: string
  updated_at: string
}
