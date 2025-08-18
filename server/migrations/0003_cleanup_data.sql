-- Migration: 0003_cleanup_data.sql
-- Description: Clean up all data and reset system to fresh state
-- This migration will only run once and is safe for development environments
-- 
-- IMPORTANT: After running this migration, you may want to run the cleanup script
-- to remove PDF files: npm run cleanup-pdfs

-- Clear all transaction data first (due to foreign key constraints)
TRUNCATE challan_items CASCADE;
TRUNCATE challans CASCADE;

-- Clear all master data
TRUNCATE customers CASCADE;
TRUNCATE firms CASCADE;
TRUNCATE shifts CASCADE;
TRUNCATE metallics CASCADE;
TRUNCATE cuts CASCADE;
TRUNCATE employees CASCADE;
TRUNCATE bob_types CASCADE;
TRUNCATE box_types CASCADE;

-- Clear printer settings
TRUNCATE printer_settings CASCADE;

-- Reset sequencing to start from beginning
UPDATE sequencing SET value = 0 WHERE key = 'challan_no';

-- Reset all auto-increment sequences to start from 1
ALTER SEQUENCE challans_id_seq RESTART WITH 1;
ALTER SEQUENCE challan_items_id_seq RESTART WITH 1;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;
ALTER SEQUENCE firms_id_seq RESTART WITH 1;
ALTER SEQUENCE shifts_id_seq RESTART WITH 1;
ALTER SEQUENCE metallics_id_seq RESTART WITH 1;
ALTER SEQUENCE cuts_id_seq RESTART WITH 1;
ALTER SEQUENCE employees_id_seq RESTART WITH 1;
ALTER SEQUENCE bob_types_id_seq RESTART WITH 1;
ALTER SEQUENCE box_types_id_seq RESTART WITH 1;
ALTER SEQUENCE printer_settings_id_seq RESTART WITH 1;

-- Note: This migration only clears database data.
-- To also clear PDF files, run: npm run cleanup-pdfs
