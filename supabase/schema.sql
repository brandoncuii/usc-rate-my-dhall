-- Run this entire file in Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS dining_halls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dining_hall_id UUID NOT NULL REFERENCES dining_halls(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dining_hall_id, slug)
);

CREATE TABLE IF NOT EXISTS menu_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  meal_period TEXT NOT NULL CHECK (meal_period IN ('breakfast', 'brunch', 'lunch', 'dinner')),
  dietary_tags TEXT[] DEFAULT '{}',
  allergens TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(station_id, name, date, meal_period)
);

CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(menu_item_id, user_id)
);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO dining_halls (name, slug) VALUES
  ('Everybody''s Kitchen', 'evk'),
  ('Parkside Restaurant & Grill', 'parkside'),
  ('USC Village Dining Hall', 'village')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE dining_halls ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "Public read" ON dining_halls FOR SELECT USING (true);
CREATE POLICY "Public read" ON stations FOR SELECT USING (true);
CREATE POLICY "Public read" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public read" ON ratings FOR SELECT USING (true);

-- Only authenticated users can rate
CREATE POLICY "Auth insert" ON ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update" ON ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Auth delete" ON ratings FOR DELETE USING (auth.uid() = user_id);
