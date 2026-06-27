-- Migration: Allow NULL category_id in products table
-- Date: 2026-03-03
-- Purpose: Enable quick product creation without requiring a category

-- Modify category_id column to allow NULL values
ALTER TABLE products MODIFY COLUMN category_id VARCHAR(36) NULL;

-- Verify the change
DESCRIBE products;
