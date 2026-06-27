-- Migration: Fix Subcategory Unique Constraint
-- This migration changes the unique constraint on subcategory_name to a composite unique constraint
-- on (subcategory_name, category_id) to allow same subcategory names across different categories

-- Step 1: Remove the existing unique constraint on subcategory_name
-- Note: The constraint name might be different in your database
-- You can find it by running: SHOW INDEX FROM subcategory;

-- For MySQL/MariaDB:
ALTER TABLE subcategory DROP INDEX subcategory_name;

-- Step 2: Add composite unique constraint on (subcategory_name, category_id)
ALTER TABLE subcategory ADD UNIQUE KEY unique_subcategory_per_category (subcategory_name, category_id);

-- Verification query:
-- SHOW INDEX FROM subcategory WHERE Key_name = 'unique_subcategory_per_category';

-- Rollback (if needed):
-- ALTER TABLE subcategory DROP INDEX unique_subcategory_per_category;
-- ALTER TABLE subcategory ADD UNIQUE KEY subcategory_name (subcategory_name);
