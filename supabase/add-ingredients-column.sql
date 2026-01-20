-- Add ingredients column to menu_items for storing dish components
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS ingredients TEXT[] DEFAULT '{}';
