-- Migration: Consolidate dishes so same dish keeps ratings across days
-- This changes the unique key from (station_id, name, date, meal_period) to (station_id, name, meal_period)

-- Step 1: Rename 'date' column to 'last_served_date'
ALTER TABLE menu_items RENAME COLUMN date TO last_served_date;

-- Step 2: For each duplicate dish (same station_id, name, meal_period),
-- keep the one with the most recent date and reassign ratings

-- First, create a temp table mapping old IDs to the ID we want to keep
CREATE TEMP TABLE dish_mapping AS
WITH ranked_dishes AS (
  SELECT
    id,
    station_id,
    name,
    meal_period,
    last_served_date,
    ROW_NUMBER() OVER (
      PARTITION BY station_id, name, meal_period
      ORDER BY last_served_date DESC
    ) as rn
  FROM menu_items
),
keeper_dishes AS (
  SELECT id as keeper_id, station_id, name, meal_period
  FROM ranked_dishes
  WHERE rn = 1
)
SELECT
  r.id as old_id,
  k.keeper_id as new_id
FROM ranked_dishes r
JOIN keeper_dishes k
  ON r.station_id = k.station_id
  AND r.name = k.name
  AND r.meal_period = k.meal_period
WHERE r.id != k.keeper_id;

-- Step 3: Update ratings to point to the keeper dish
UPDATE ratings
SET menu_item_id = dm.new_id
FROM dish_mapping dm
WHERE ratings.menu_item_id = dm.old_id;

-- Step 4: Delete duplicate menu items (keeping only the most recent)
DELETE FROM menu_items
WHERE id IN (SELECT old_id FROM dish_mapping);

-- Step 5: Drop the old unique constraint and create new one
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_station_id_name_date_meal_period_key;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_station_name_meal_unique UNIQUE (station_id, name, meal_period);

-- Clean up
DROP TABLE dish_mapping;

-- Verify: Check the new structure
SELECT 'Migration complete. Dishes are now unique by station_id + name + meal_period.' as status;
SELECT COUNT(*) as total_dishes FROM menu_items;
SELECT COUNT(*) as total_ratings FROM ratings;
