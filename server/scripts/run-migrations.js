#!/usr/bin/env node

/**
 * Migration runner script
 * Runs SQL migrations in order
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get database connection from environment
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/metallic_challan'
});

async function ensureMigrationsTable() {
  await pool.query(`
    create table if not exists _migrations (
      name text primary key,
      run_on timestamptz not null default now()
    )
  `);
}

async function getRanMigrations() {
  const res = await pool.query("select name from _migrations");
  return new Set(res.rows.map((r) => r.name));
}

async function run() {
  try {
    console.log('🚀 Starting migrations...');
    
    await ensureMigrationsTable();
    
    const migrationsDir = path.resolve(__dirname, '../migrations');
    const files = (await fs.promises.readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort();
    
    const ran = await getRanMigrations();
    
    console.log(`📁 Found ${files.length} migration files`);
    console.log(`✅ Already applied: ${ran.size} migrations`);
    
    for (const file of files) {
      if (ran.has(file)) {
        console.log(`⏭️  Skipping already applied migration: ${file}`);
        continue;
      }
      
      const filepath = path.join(migrationsDir, file);
      const sql = await fs.promises.readFile(filepath, 'utf8');
      
      console.log(`🔄 Applying migration: ${file}`);
      
      await pool.query('BEGIN');
      try {
        await pool.query(sql);
        await pool.query("insert into _migrations (name) values ($1)", [file]);
        await pool.query('COMMIT');
        console.log(`✅ Successfully applied: ${file}`);
      } catch (err) {
        await pool.query('ROLLBACK');
        console.error(`❌ Failed migration ${file}:`, err.message);
        throw err;
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations
run();
