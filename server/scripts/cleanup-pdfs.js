#!/usr/bin/env node

/**
 * Cleanup script to remove all PDF files from Challans folder
 * This script complements the 0003_cleanup_data.sql migration
 * Run with: npm run cleanup-pdfs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (two levels up from scripts folder)
const projectRoot = path.resolve(__dirname, '../..');
const challansDir = path.join(projectRoot, 'Challans');

async function cleanupPDFs() {
  try {
    console.log('🧹 Starting PDF cleanup...');
    console.log(`📁 Challans directory: ${challansDir}`);

    if (!fs.existsSync(challansDir)) {
      console.log('✅ Challans directory does not exist - nothing to clean');
      return;
    }

    let totalFiles = 0;
    let totalSize = 0;

    // Recursively find and remove all PDF files
    function removePDFs(dir) {
      if (!fs.existsSync(dir)) return;

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          removePDFs(fullPath);
          // Remove empty directories
          try {
            fs.rmdirSync(fullPath);
            console.log(`🗑️  Removed empty directory: ${fullPath}`);
          } catch (err) {
            // Directory not empty, ignore
          }
        } else if (item.toLowerCase().endsWith('.pdf')) {
          const size = stat.size;
          fs.unlinkSync(fullPath);
          totalFiles++;
          totalSize += size;
          console.log(`🗑️  Removed PDF: ${fullPath} (${(size / 1024).toFixed(1)} KB)`);
        }
      }
    }

    removePDFs(challansDir);

    console.log('\n🎉 PDF cleanup completed!');
    console.log(`📊 Total files removed: ${totalFiles}`);
    console.log(`💾 Total space freed: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (totalFiles === 0) {
      console.log('✨ No PDF files found to remove');
    }

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run cleanup
cleanupPDFs();
