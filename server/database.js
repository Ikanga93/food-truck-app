import pg from 'pg'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production'

// Railway provides these environment variables automatically when you add PostgreSQL
const railwayDatabaseUrl = process.env.DATABASE_URL || 
                          process.env.DATABASE_PRIVATE_URL || 
                          process.env.DATABASE_PUBLIC_URL ||
                          process.env.POSTGRES_URL

const hasPostgresUrl = railwayDatabaseUrl && railwayDatabaseUrl.startsWith('postgresql://')

console.log('🔍 Environment check:')
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('isDevelopment:', isDevelopment)
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL)
console.log('DATABASE_PRIVATE_URL exists:', !!process.env.DATABASE_PRIVATE_URL)
console.log('DATABASE_PUBLIC_URL exists:', !!process.env.DATABASE_PUBLIC_URL)
console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL)
console.log('hasPostgresUrl:', hasPostgresUrl)

let db
let isPostgreSQL = false

if (isDevelopment) {
  // Development only: Use SQLite
  console.log('🔧 Development mode: Using SQLite database')
  const dbPath = path.join(__dirname, 'orders.db')
  db = new sqlite3.Database(dbPath)
  isPostgreSQL = false
} else if (hasPostgresUrl) {
  // Production: Use PostgreSQL on Railway
  console.log('🚀 Production mode: Using PostgreSQL database')
  console.log('🔗 Database URL found:', railwayDatabaseUrl ? 'Yes (hidden for security)' : 'No')
  
  const { Pool } = pg
  
  const pool = new Pool({
    connectionString: railwayDatabaseUrl,
    ssl: { rejectUnauthorized: false }
  })
  
  // Test the connection
  pool.connect((err, client, release) => {
    if (err) {
      console.error('❌ PostgreSQL connection failed:', err.message)
      console.error('❌ This is a critical error in production!')
      process.exit(1) // Exit if PostgreSQL fails in production
    }
    console.log('✅ PostgreSQL connected successfully')
    release()
  })
  
  db = pool
  isPostgreSQL = true
} else {
  // Production fallback - but this should not happen on Railway
  console.error('❌ CRITICAL: No PostgreSQL database URL found in production!')
  console.error('❌ Please configure DATABASE_URL in Railway environment variables')
  console.error('❌ Using SQLite as emergency fallback, but this will lose data on restart!')
  
  const dbPath = './orders.db'
  db = new sqlite3.Database(dbPath)
  isPostgreSQL = false
}

// Helper function to run queries
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isPostgreSQL) {
      // PostgreSQL
      db.query(sql, params)
        .then(result => {
          if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
            resolve({ 
              insertId: result.insertId || result.rows[0]?.id, 
              changes: result.rowCount,
              lastID: result.insertId || result.rows[0]?.id
            })
          } else if (sql.includes('SELECT') && sql.includes('LIMIT 1')) {
            resolve(result.rows[0])
          } else {
            resolve(result.rows)
          }
        })
        .catch(err => reject(err))
    } else {
      // SQLite
      if (sql.includes('INSERT') || sql.includes('UPDATE') || sql.includes('DELETE')) {
        db.run(sql, params, function(err) {
          if (err) reject(err)
          else resolve({ insertId: this.lastID, changes: this.changes, lastID: this.lastID })
        })
      } else if (sql.includes('SELECT') && sql.includes('LIMIT 1')) {
        // Single row query
        db.get(sql, params, (err, row) => {
          if (err) reject(err)
          else resolve(row)
        })
      } else {
        // Multiple rows query
        db.all(sql, params, (err, rows) => {
          if (err) reject(err)
          else resolve(rows)
        })
      }
    }
  })
}

// Helper function for single row queries
export const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isPostgreSQL) {
      db.query(sql, params)
        .then(result => resolve(result.rows[0]))
        .catch(err => reject(err))
    } else {
      db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    }
  })
}

// Helper function for multiple row queries
export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isPostgreSQL) {
      db.query(sql, params)
        .then(result => resolve(result.rows))
        .catch(err => reject(err))
    } else {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    }
  })
}

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    if (isPostgreSQL) {
      // PostgreSQL table creation (convert SQLite to PostgreSQL syntax)
      await initializePostgreSQLTables()
    } else {
      // SQLite table creation (keep existing structure)
      await initializeSQLiteTables()
    }
    console.log('✅ Database tables initialized successfully')
  } catch (error) {
    console.error('❌ Error initializing database:', error)
  }
}

const initializeSQLiteTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        phone TEXT UNIQUE,
        password_hash TEXT,
        role TEXT NOT NULL CHECK(role IN ('admin', 'customer')),
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)

      // Menu items table
      db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        emoji TEXT,
        image_url TEXT,
        available BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`)

      // Orders table
      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT NOT NULL,
        customer_phone TEXT NOT NULL,
        customer_email TEXT,
        items TEXT NOT NULL,
        subtotal REAL,
        tax REAL,
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        estimated_completion DATETIME,
        estimated_time INTEGER,
        time_remaining INTEGER DEFAULT 0,
        location_id TEXT,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )`)

      resolve()
    })
  })
}

const initializePostgreSQLTables = async () => {
  // Users table
  await query(`CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(255) UNIQUE,
    password_hash TEXT,
    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'customer')),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Menu items table
  await query(`CREATE TABLE IF NOT EXISTS menu_items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)

  // Orders table
  await query(`CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255),
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255),
    items TEXT NOT NULL,
    subtotal DECIMAL(10,2),
    tax DECIMAL(10,2),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_completion TIMESTAMP,
    estimated_time INTEGER,
    time_remaining INTEGER DEFAULT 0,
    location_id VARCHAR(255),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Auth tokens table
  await query(`CREATE TABLE IF NOT EXISTS auth_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    token TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Customer profiles table
  await query(`CREATE TABLE IF NOT EXISTS customer_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    preferences JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Admin profiles table
  await query(`CREATE TABLE IF NOT EXISTS admin_profiles (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    permissions JSONB,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)

  // Order status history table
  await query(`CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id)
  )`)

  // Locations table
  await query(`CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'mobile',
    description TEXT,
    current_location VARCHAR(255),
    schedule TEXT,
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
}

export default db
