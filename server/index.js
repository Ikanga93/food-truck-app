import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import sqlite3 from 'sqlite3'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import fs from 'fs'

// Set timezone to Central Time
process.env.TZ = 'America/Chicago'

// Helper function to get current Central Time
const getCentralTime = () => {
  return new Date().toLocaleString("en-US", {timeZone: "America/Chicago"})
}

// Helper function to format date for SQLite in Central Time
const formatDateForDB = (date = new Date()) => {
  return new Date(date.toLocaleString("en-US", {timeZone: "America/Chicago"}))
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ')
}

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, "https://*.railway.app", "https://*.up.railway.app"]
      : ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }
})

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key')

// Setup multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, 'menu-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'))
    }
  }
})

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.FRONTEND_URL, "https://*.railway.app", "https://*.up.railway.app"]
    : ["http://localhost:5173", "http://localhost:5174"]
}))
app.use(express.json())

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
}

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')))

// Initialize SQLite Database
const dbPath = process.env.NODE_ENV === 'production' ? './orders.db' : './server/orders.db'
const db = new sqlite3.Database(dbPath)

// Create tables
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

  // Customer profiles table
  db.run(`CREATE TABLE IF NOT EXISTS customer_profiles (
    user_id TEXT PRIMARY KEY,
    address TEXT,
    preferences TEXT,
    loyalty_points INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  // Admin profiles table
  db.run(`CREATE TABLE IF NOT EXISTS admin_profiles (
    user_id TEXT PRIMARY KEY,
    restaurant_id TEXT,
    permissions TEXT,
    last_login DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  // Authentication tokens table
  db.run(`CREATE TABLE IF NOT EXISTS auth_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('access', 'refresh')),
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    total REAL NOT NULL,
    status TEXT DEFAULT 'pending_payment',
    location_id TEXT NOT NULL,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    estimated_time INTEGER DEFAULT 20,
    time_remaining INTEGER,
    stripe_session_id TEXT,
    payment_status TEXT DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`)

  // Migration: Add user_id column to existing orders table if it doesn't exist
  db.run(`PRAGMA table_info(orders)`, [], (err, rows) => {
    if (err) {
      console.error('Error checking orders table schema:', err)
      return
    }
    
    // Check if user_id column exists
    db.all(`PRAGMA table_info(orders)`, [], (err, columns) => {
      if (err) {
        console.error('Error getting table info:', err)
        return
      }
      
      const hasUserId = columns.some(col => col.name === 'user_id')
      if (!hasUserId) {
        console.log('Adding user_id column to orders table...')
        db.run(`ALTER TABLE orders ADD COLUMN user_id TEXT`, (err) => {
          if (err) {
            console.error('Error adding user_id column:', err)
          } else {
            console.log('Successfully added user_id column to orders table')
          }
        })
      }
    })
  })

  // Order status history table
  db.run(`CREATE TABLE IF NOT EXISTS order_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders (id)
  )`)

  // Menu items table
  db.run(`CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    emoji TEXT,
    available BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT
  )`)

  // Migration: Add image_url column to existing menu_items table if it doesn't exist
  db.run(`PRAGMA table_info(menu_items)`, [], (err, rows) => {
    if (err) {
      console.error('Error checking menu_items table schema:', err)
      return
    }
    
    // Check if image_url column exists
    db.all(`PRAGMA table_info(menu_items)`, [], (err, columns) => {
      if (err) {
        console.error('Error getting menu_items table info:', err)
        return
      }
      
      const hasImageUrl = columns.some(col => col.name === 'image_url')
      if (!hasImageUrl) {
        console.log('Adding image_url column to menu_items table...')
        db.run(`ALTER TABLE menu_items ADD COLUMN image_url TEXT`, (err) => {
          if (err) {
            console.error('Error adding image_url column:', err)
          } else {
            console.log('Successfully added image_url column to menu_items table')
          }
        })
      }
    })
  })

  // Locations table
  db.run(`CREATE TABLE IF NOT EXISTS locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    current_location TEXT,
    status TEXT DEFAULT 'active',
    schedule TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)
  
  socket.on('join-admin', () => {
    socket.join('admin')
    console.log('Admin joined')
  })
  
  socket.on('join-customer', (orderId) => {
    socket.join(`order-${orderId}`)
    console.log(`Customer joined order tracking: ${orderId}`)
  })
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user
    next()
  })
}

// Role-based authorization middleware
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Unauthorized access' })
    }
    next()
  }
}

// API Routes

// Create order and Stripe checkout session
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      items,
      subtotal,
      tax,
      total,
      locationId
    } = req.body

    const orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`
    const estimatedTime = 20 // Default 20 minutes

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: `Fernando's Food Truck - ${item.name}`,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }))

    // Add tax as a line item if applicable
    if (tax > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Tax',
            description: 'Sales Tax',
          },
          unit_amount: Math.round(tax * 100),
        },
        quantity: 1,
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-tracking/${orderId}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        orderId: orderId,
        customerName: customerName,
        customerPhone: customerPhone,
        locationId: locationId
      }
    })

    // Insert order into database with pending_payment status
    db.run(
      `INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, items, 
        subtotal, tax, total, location_id, estimated_time, time_remaining,
        stripe_session_id, status, order_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        customerName,
        customerPhone,
        customerEmail,
        JSON.stringify(items),
        subtotal,
        tax,
        total,
        locationId,
        estimatedTime,
        estimatedTime,
        session.id,
        'pending_payment',
        formatDateForDB()
      ],
      function(err) {
        if (err) {
          console.error('Database error:', err)
          return res.status(500).json({ error: 'Failed to create order' })
        }

        // Add initial status to history
        db.run(
          'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
          [orderId, 'pending_payment']
        )

        res.json({ 
          orderId, 
          checkoutUrl: session.url,
          sessionId: session.id
        })
      }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all orders (for admin dashboard)
app.get('/api/orders', (req, res) => {
  db.all(
    'SELECT * FROM orders ORDER BY order_time DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err)
        return res.status(500).json({ error: 'Failed to fetch orders' })
      }

      const orders = rows.map(row => ({
        ...row,
        items: JSON.parse(row.items),
        orderTime: new Date(row.order_time)
      }))

      res.json(orders)
    }
  )
})

// Get specific order (for customer tracking)
app.get('/api/orders/:orderId', (req, res) => {
  const { orderId } = req.params

  db.get(
    'SELECT * FROM orders WHERE id = ?',
    [orderId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err)
        return res.status(500).json({ error: 'Failed to fetch order' })
      }

      if (!row) {
        return res.status(404).json({ error: 'Order not found' })
      }

      const order = {
        ...row,
        items: JSON.parse(row.items),
        orderTime: new Date(row.order_time)
      }

      res.json(order)
    }
  )
})

// Get orders for a specific customer
app.get('/api/orders/customer/:customerId', authenticateToken, (req, res) => {
  const { customerId } = req.params

  // Ensure customer can only access their own orders
  if (req.user.role === 'customer' && req.user.id !== customerId) {
    return res.status(403).json({ error: 'Access denied' })
  }

  db.all(
    'SELECT * FROM orders WHERE user_id = ? ORDER BY order_time DESC',
    [customerId],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err)
        return res.status(500).json({ error: 'Failed to fetch customer orders' })
      }

      const orders = rows.map(row => ({
        ...row,
        items: JSON.parse(row.items),
        orderTime: new Date(row.order_time)
      }))

      res.json(orders)
    }
  )
})

// Update order status
app.patch('/api/orders/:orderId/status', (req, res) => {
  const { orderId } = req.params
  const { status } = req.body

  // Calculate time remaining based on status
  let timeRemaining = null
  if (status === 'cooking') {
    timeRemaining = 20 // Reset to estimated time when cooking starts
  } else if (status === 'ready' || status === 'completed') {
    timeRemaining = 0
  }

  const updateQuery = timeRemaining !== null 
    ? 'UPDATE orders SET status = ?, time_remaining = ? WHERE id = ?'
    : 'UPDATE orders SET status = ? WHERE id = ?'
  
  const params = timeRemaining !== null 
    ? [status, timeRemaining, orderId]
    : [status, orderId]

  db.run(updateQuery, params, function(err) {
    if (err) {
      console.error('Database error:', err)
      return res.status(500).json({ error: 'Failed to update order status' })
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Add status change to history
    db.run(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, status]
    )

    // Get updated order
    db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
      if (row) {
        const updatedOrder = {
          ...row,
          items: JSON.parse(row.items),
          orderTime: new Date(row.order_time)
        }

        // Notify admin and customer of status change
        io.to('admin').emit('order-updated', updatedOrder)
        io.to(`order-${orderId}`).emit('order-status-updated', updatedOrder)
      }
    })

    res.json({ success: true })
  })
})

// Verify payment and update order
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId, orderId } = req.body

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      // Update order status to confirmed and payment to completed
      db.run(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['completed', 'confirmed', orderId],
        function(err) {
          if (err) {
            console.error('Database error:', err)
            return res.status(500).json({ error: 'Failed to update order' })
          }

          // Add status change to history
          db.run(
            'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
            [orderId, 'confirmed']
          )

          // Get updated order and notify admin
          db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, row) => {
            if (row) {
              const updatedOrder = {
                ...row,
                items: JSON.parse(row.items),
                orderTime: new Date(row.order_time)
              }

              // Notify admin of new paid order
              io.to('admin').emit('new-order', updatedOrder)
              io.to(`order-${orderId}`).emit('order-status-updated', updatedOrder)
            }
          })

          res.json({ success: true, paymentStatus: 'completed' })
        }
      )
    } else {
      res.json({ success: false, paymentStatus: session.payment_status })
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ error: error.message })
  }
})

// Stripe webhook for payment confirmation
app.post('/api/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      const orderId = session.metadata.orderId
      
      // Update order payment status
      db.run(
        'UPDATE orders SET payment_status = ?, status = ? WHERE stripe_session_id = ?',
        ['completed', 'confirmed', session.id]
      )
      
      console.log(`Payment completed for order: ${orderId}`)
      break
    default:
      console.log(`Unhandled event type ${event.type}`)
  }

  res.json({received: true})
})

// Menu Items API Routes

// Upload menu item image
app.post('/api/upload-menu-image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }
    
    const imageUrl = `/uploads/${req.file.filename}`
    res.json({ imageUrl })
  } catch (error) {
    console.error('Error uploading image:', error)
    res.status(500).json({ error: 'Failed to upload image' })
  }
})

// Get all menu items
app.get('/api/menu', (req, res) => {
  db.all('SELECT * FROM menu_items ORDER BY category, name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching menu items:', err)
      res.status(500).json({ error: 'Failed to fetch menu items' })
    } else {
      res.json(rows)
    }
  })
})

// Add new menu item
app.post('/api/menu', (req, res) => {
  const { name, description, price, category, emoji, available, image_url } = req.body
  
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' })
  }

  db.run(
    'INSERT INTO menu_items (name, description, price, category, emoji, available, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, description, price, category, emoji, available !== false, image_url],
    function(err) {
      if (err) {
        console.error('Error adding menu item:', err)
        res.status(500).json({ error: 'Failed to add menu item' })
      } else {
        // Return the created item
        db.get('SELECT * FROM menu_items WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            res.status(500).json({ error: 'Failed to fetch created item' })
          } else {
            res.json(row)
          }
        })
      }
    }
  )
})

// Update menu item
app.put('/api/menu/:id', (req, res) => {
  const { id } = req.params
  const { name, description, price, category, emoji, available, image_url } = req.body
  
  db.run(
    'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, emoji = ?, available = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description, price, category, emoji, available, image_url, id],
    function(err) {
      if (err) {
        console.error('Error updating menu item:', err)
        res.status(500).json({ error: 'Failed to update menu item' })
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Menu item not found' })
      } else {
        res.json({ success: true, changes: this.changes })
      }
    }
  )
})

// Delete menu item
app.delete('/api/menu/:id', (req, res) => {
  const { id } = req.params
  
  db.run('DELETE FROM menu_items WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting menu item:', err)
      res.status(500).json({ error: 'Failed to delete menu item' })
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Menu item not found' })
    } else {
      res.json({ success: true, changes: this.changes })
    }
  })
})

// Locations API Routes

// Get all locations
app.get('/api/locations', (req, res) => {
  db.all('SELECT * FROM locations ORDER BY name', [], (err, rows) => {
    if (err) {
      console.error('Error fetching locations:', err)
      res.status(500).json({ error: 'Failed to fetch locations' })
    } else {
      res.json(rows)
    }
  })
})

// Add new location
app.post('/api/locations', (req, res) => {
  const { id, name, type, description, current_location, schedule, phone, status } = req.body
  
  if (!id || !name) {
    return res.status(400).json({ error: 'ID and name are required' })
  }

  db.run(
    'INSERT INTO locations (id, name, type, description, current_location, schedule, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, name, type || 'mobile', description, current_location, schedule, phone, status || 'active'],
    function(err) {
      if (err) {
        console.error('Error adding location:', err)
        if (err.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
          res.status(400).json({ error: 'Location ID already exists' })
        } else {
          res.status(500).json({ error: 'Failed to add location' })
        }
      } else {
        // Return the created location
        db.get('SELECT * FROM locations WHERE id = ?', [id], (err, row) => {
          if (err) {
            res.status(500).json({ error: 'Failed to fetch created location' })
          } else {
            res.json(row)
          }
        })
      }
    }
  )
})

// Update location
app.put('/api/locations/:id', (req, res) => {
  const { id } = req.params
  const { name, type, description, current_location, schedule, phone, status } = req.body
  
  db.run(
    'UPDATE locations SET name = ?, type = ?, description = ?, current_location = ?, schedule = ?, phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, type, description, current_location, schedule, phone, status, id],
    function(err) {
      if (err) {
        console.error('Error updating location:', err)
        res.status(500).json({ error: 'Failed to update location' })
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Location not found' })
      } else {
        res.json({ success: true, changes: this.changes })
      }
    }
  )
})

// Delete location
app.delete('/api/locations/:id', (req, res) => {
  const { id } = req.params
  
  db.run('DELETE FROM locations WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Error deleting location:', err)
      res.status(500).json({ error: 'Failed to delete location' })
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Location not found' })
    } else {
      res.json({ success: true, changes: this.changes })
    }
  })
})

// Timer to update cooking orders
setInterval(() => {
  db.all(
    'SELECT * FROM orders WHERE status = "cooking" AND time_remaining > 0',
    [],
    (err, rows) => {
      if (err) return

      rows.forEach(order => {
        const newTimeRemaining = Math.max(0, order.time_remaining - 1)
        const newStatus = newTimeRemaining === 0 ? 'ready' : 'cooking'

        db.run(
          'UPDATE orders SET time_remaining = ?, status = ? WHERE id = ?',
          [newTimeRemaining, newStatus, order.id],
          () => {
            if (newStatus === 'ready') {
              // Add status change to history
              db.run(
                'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
                [order.id, 'ready']
              )
            }

            // Get updated order and emit to clients
            db.get('SELECT * FROM orders WHERE id = ?', [order.id], (err, updatedRow) => {
              if (updatedRow) {
                const updatedOrder = {
                  ...updatedRow,
                  items: JSON.parse(updatedRow.items),
                  orderTime: new Date(updatedRow.order_time)
                }

                io.to('admin').emit('order-updated', updatedOrder)
                io.to(`order-${order.id}`).emit('order-status-updated', updatedOrder)
              }
            })
          }
        )
      })
    }
  )
}, 60000) // Update every minute

// Dashboard API Route
app.get('/api/dashboard', (req, res) => {
  // Get counts and statistics from database
  db.get('SELECT COUNT(*) as total_orders FROM orders', [], (err, orderCount) => {
    if (err) {
      console.error('Error fetching order count:', err)
      return res.status(500).json({ error: 'Failed to fetch dashboard data' })
    }

    db.get('SELECT COUNT(*) as total_menu_items FROM menu_items', [], (err, menuCount) => {
      if (err) {
        console.error('Error fetching menu count:', err)
        return res.status(500).json({ error: 'Failed to fetch dashboard data' })
      }

      db.get('SELECT COUNT(*) as total_locations FROM locations', [], (err, locationCount) => {
        if (err) {
          console.error('Error fetching location count:', err)
          return res.status(500).json({ error: 'Failed to fetch dashboard data' })
        }

        // Get recent orders
        db.all(
          'SELECT * FROM orders ORDER BY order_time DESC LIMIT 5',
          [],
          (err, recentOrders) => {
            if (err) {
              console.error('Error fetching recent orders:', err)
              return res.status(500).json({ error: 'Failed to fetch dashboard data' })
            }

            // Get order status distribution
            db.all(
              'SELECT status, COUNT(*) as count FROM orders GROUP BY status',
              [],
              (err, statusDistribution) => {
                if (err) {
                  console.error('Error fetching status distribution:', err)
                  return res.status(500).json({ error: 'Failed to fetch dashboard data' })
                }

                // Format the response
                const dashboardData = {
                  summary: {
                    totalOrders: orderCount.total_orders,
                    totalMenuItems: menuCount.total_menu_items,
                    totalLocations: locationCount.total_locations
                  },
                  recentOrders: recentOrders.map(order => ({
                    ...order,
                    items: JSON.parse(order.items),
                    orderTime: new Date(order.order_time)
                  })),
                  orderStatusDistribution: statusDistribution
                }

                res.json(dashboardData)
              }
            )
          }
        )
      })
    })
  })
})

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, role, firstName, lastName } = req.body

    // Validate required fields
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' })
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }
    if (!role || !['admin', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' })
    }

    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? OR phone = ?',
        [email, phone],
        (err, row) => {
          if (err) reject(err)
          resolve(row)
        }
      )
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user
    const userId = `USER-${uuidv4().substring(0, 8).toUpperCase()}`
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, email, phone, passwordHash, role, firstName, lastName],
        (err) => {
          if (err) reject(err)
          resolve()
        }
      )
    })

    // Create profile based on role
    if (role === 'customer') {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO customer_profiles (user_id) VALUES (?)',
          [userId],
          (err) => {
            if (err) reject(err)
            resolve()
          }
        )
      })
    } else if (role === 'admin') {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO admin_profiles (user_id) VALUES (?)',
          [userId],
          (err) => {
            if (err) reject(err)
            resolve()
          }
        )
      })
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    )
    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Store refresh token
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, datetime("now", "+7 days"))',
        [uuidv4(), userId, refreshToken, 'refresh'],
        (err) => {
          if (err) reject(err)
          resolve()
        }
      )
    })

    res.json({
      message: 'Registration successful',
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        phone,
        role,
        firstName,
        lastName
      }
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
})

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, phone, password } = req.body

    // Validate input
    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone is required' })
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required' })
    }

    // Find user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE email = ? OR phone = ?',
        [email, phone],
        (err, row) => {
          if (err) reject(err)
          resolve(row)
        }
      )
    })

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    )
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    // Store refresh token
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, datetime("now", "+7 days"))',
        [uuidv4(), user.id, refreshToken, 'refresh'],
        (err) => {
          if (err) reject(err)
          resolve()
        }
      )
    })

    // Update last login for admin
    if (user.role === 'admin') {
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE admin_profiles SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
          [user.id],
          (err) => {
            if (err) reject(err)
            resolve()
          }
        )
      })
    }

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'your-secret-key')

    // Check if token exists in database
    const token = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM auth_tokens WHERE token = ? AND type = "refresh" AND expires_at > CURRENT_TIMESTAMP',
        [refreshToken],
        (err, row) => {
          if (err) reject(err)
          resolve(row)
        }
      )
    })

    if (!token) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    // Get user
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [decoded.id],
        (err, row) => {
          if (err) reject(err)
          resolve(row)
        }
      )
    })

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    )

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      }
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(500).json({ error: 'Token refresh failed' })
  }
})

// Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      // Remove refresh token from database
      await new Promise((resolve, reject) => {
        db.run(
          'DELETE FROM auth_tokens WHERE token = ? AND user_id = ?',
          [refreshToken, req.user.id],
          (err) => {
            if (err) reject(err)
            resolve()
          }
        )
      })
    }

    res.json({ message: 'Logout successful' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Logout failed' })
  }
})

// Get current user
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err)
          resolve(row)
        }
      )
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

// Serve React app for client-side routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Don't serve React app for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' })
    }
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// Start server
const PORT = process.env.PORT || 3002
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard`)
  console.log(`🛒 Orders API: http://localhost:${PORT}/api/orders`)
}) 