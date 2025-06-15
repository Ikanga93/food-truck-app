import pg from 'pg'
import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database configuration
const isDevelopment = process.env.NODE_ENV !== 'production'

let db

if (isDevelopment) {
  // Development: Use SQLite
  console.log('🔧 Development mode: Using SQLite database')
  const dbPath = path.join(__dirname, 'orders.db')
  db = new sqlite3.Database(dbPath)
} else {
  // Production: Use PostgreSQL on Railway
  console.log('🚀 Production mode: Using PostgreSQL database')
  const { Pool } = pg
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  })
  
  db = pool
}

// Helper function to run queries
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
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
    } else {
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
    }
  })
}

// Helper function for single row queries
export const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
      db.get(sql, params, (err, row) => {
        if (err) reject(err)
        else resolve(row)
      })
    } else {
      db.query(sql, params)
        .then(result => resolve(result.rows[0]))
        .catch(err => reject(err))
    }
  })
}

// Helper function for multiple row queries
export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (isDevelopment) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err)
        else resolve(rows)
      })
    } else {
      db.query(sql, params)
        .then(result => resolve(result.rows))
        .catch(err => reject(err))
    }
  })
}

// Initialize database tables
export const initializeDatabase = async () => {
  try {
    if (isDevelopment) {
      // SQLite table creation (keep existing structure)
      await initializeSQLiteTables()
    } else {
      // PostgreSQL table creation (convert SQLite to PostgreSQL syntax)
      await initializePostgreSQLTables()
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
        total_amount REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        estimated_completion DATETIME,
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
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estimated_completion TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`)
}

export default db
