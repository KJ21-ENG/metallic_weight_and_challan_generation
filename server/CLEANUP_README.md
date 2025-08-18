# Database Cleanup Guide

This guide explains how to reset your database to a fresh state using the cleanup migration.

## 🧹 What the Cleanup Does

The cleanup process will:
- ✅ Remove all data from all tables
- ✅ Reset challan numbering to start from 1
- ✅ Reset all auto-increment sequences to start from 1
- ✅ Remove all generated PDF files
- ✅ Keep table structures intact
- ✅ Reset the system to "first-time installation" state

## 🚀 How to Run Cleanup

### Option 1: Complete Cleanup (Recommended)
```bash
# 1. Run the SQL migration (clears database)
npm run migrate

# 2. Clean up PDF files (optional but recommended)
npm run cleanup-pdfs
```

### Option 2: Manual Cleanup
```bash
# Only clear database (PDFs remain)
npm run migrate

# Only clear PDFs (database remains)
npm run cleanup-pdfs
```

## 📁 Files Created

- **`migrations/0003_cleanup_data.sql`** - SQL migration that clears all data
- **`scripts/cleanup-pdfs.js`** - Node.js script that removes PDF files
- **`CLEANUP_README.md`** - This documentation file

## 🔒 Safety Features

- **One-time execution**: Each migration runs only once
- **Transaction safety**: All operations are wrapped in transactions
- **Rollback protection**: If anything fails, changes are rolled back
- **Development only**: Safe for development/testing environments

## 📊 What Gets Cleaned

### Database Tables
- `challans` - All delivery challans
- `challan_items` - All challan line items
- `customers` - All customer records
- `firms` - All firm records
- `shifts` - All shift definitions
- `metallics` - All metallic types
- `cuts` - All cut types
- `employees` - All employee records
- `bob_types` - All bob type definitions
- `box_types` - All box type definitions
- `printer_settings` - All printer configurations
- `sequencing` - Reset to challan_no = 0

### Auto-increment Sequences
- All `id` columns will start from 1 again
- Next challan will have `id = 1` (not 27)
- Next customer will have `id = 1` (not 4)
- All sequences reset to their initial state

### File System
- `Challans/` folder - All PDF files and subdirectories

## ⚠️ Important Notes

1. **This is irreversible** - All data will be permanently deleted
2. **Run only in development** - Never run in production
3. **Backup first** - Consider backing up data before cleanup
4. **Sequential execution** - Migrations run in numerical order

## 🔄 Migration Order

When you run `npm run migrate`, migrations execute in this order:
1. `0001_init.sql` - Creates initial tables
2. `0002_add_firms.sql` - Adds firms table
3. `0003_cleanup_data.sql` - **Cleans all data** ⚠️

## 🆕 Adding New Migrations

After adding this cleanup migration, new migrations will be numbered:
- `0004_your_new_migration.sql`
- `0005_another_migration.sql`
- etc.

The cleanup migration will **never run again** once executed.

## 🚨 Troubleshooting

### Migration Already Applied
If you see "Skipping already applied migration: 0003_cleanup_data.sql", the cleanup has already run.

### PDF Cleanup Fails
If `npm run cleanup-pdfs` fails, manually remove the `Challans/` folder:
```bash
rm -rf Challans/
```

### Database Connection Issues
Ensure your database is running and `.env` file is configured correctly.

## 📝 Example Usage

```bash
# Start with a fresh database
cd server
npm run migrate
npm run cleanup-pdfs

# Verify cleanup
psql postgres://postgres:postgres@localhost:5432/metallic_challan -c "SELECT COUNT(*) FROM challans"
# Should return: 0

# Start your application
npm run dev
```

## 🎯 When to Use

- **Development reset**: Start fresh after major changes
- **Testing**: Clean state for integration tests
- **Demo preparation**: Remove test data before presentations
- **Bug investigation**: Isolate issues from data problems

---

**Remember**: This cleanup is designed for development environments only. Never use in production!
