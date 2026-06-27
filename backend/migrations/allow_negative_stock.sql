-- Migration: Allow Negative Stock Values
-- Purpose: Remove minimum value constraint on stock quantity to allow negative values
-- This allows selling items before they arrive in stock

-- Remove the CHECK constraint on quantity column if it exists
-- Note: The exact constraint name may vary depending on your database

-- For MySQL/MariaDB:
ALTER TABLE stock MODIFY COLUMN quantity INT NOT NULL DEFAULT 0 COMMENT 'Can be negative if sold before stock arrival';

-- For PostgreSQL (if you're using it):
-- ALTER TABLE stock DROP CONSTRAINT IF EXISTS stock_quantity_check;
-- ALTER TABLE stock ALTER COLUMN quantity DROP NOT NULL;
-- ALTER TABLE stock ALTER COLUMN quantity SET DEFAULT 0;
-- COMMENT ON COLUMN stock.quantity IS 'Can be negative if sold before stock arrival';

-- For SQLite (if you're using it):
-- SQLite doesn't support ALTER COLUMN directly, you would need to:
-- 1. Create a new table without the constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

-- Verify the change
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    COLUMN_DEFAULT,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM 
    INFORMATION_SCHEMA.COLUMNS
WHERE 
    TABLE_NAME = 'stock' 
    AND COLUMN_NAME = 'quantity';
