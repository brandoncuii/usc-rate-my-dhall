-- Run this in Supabase SQL Editor to enable menu data imports
-- These policies allow the fetch-menu script to write data

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public insert" ON stations;
DROP POLICY IF EXISTS "Public insert" ON menu_items;
DROP POLICY IF EXISTS "Public update" ON menu_items;

-- Allow public inserts to stations table
CREATE POLICY "Public insert" ON stations FOR INSERT WITH CHECK (true);

-- Allow public inserts and updates to menu_items table
CREATE POLICY "Public insert" ON menu_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update" ON menu_items FOR UPDATE USING (true);
