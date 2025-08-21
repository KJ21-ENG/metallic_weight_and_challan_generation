-- Migration: 0004_add_mobile_to_customers.sql
-- Description: Add mobile field to customers table

-- Add mobile column to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS mobile text;

-- Add comment for documentation
COMMENT ON COLUMN customers.mobile IS 'Customer mobile phone number';
