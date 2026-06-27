-- Migration: Add description column to category table if it doesn't exist
-- This ensures the description field is available for category add/update operations

-- Check if description column exists, if not add it
ALTER TABLE category 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'category' 
AND column_name = 'description';
