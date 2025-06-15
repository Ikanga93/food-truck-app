import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import Stripe from 'stripe'
import { v4 as uuidv4 } from 'uuid'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import fs from 'fs'
import { query, queryOne, queryAll, initializeDatabase } from './database.js'

// Load environment variables first
dotenv.config()

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

// Initialize database
initializeDatabase()

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
      locationId,
      estimatedTime = 20,
      userId = null
    } = req.body

    // Validate required fields
    if (!customerName || !customerPhone || !items || !subtotal || !tax || !total || !locationId) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const orderId = `ORDER-${uuidv4().substring(0, 8).toUpperCase()}`
    const timeRemaining = estimatedTime

    // Insert order into database with pending_payment status
    await query(
      `INSERT INTO orders (
        id, customer_name, customer_phone, customer_email, items, 
        subtotal, tax, total, location_id, estimated_time, time_remaining,
        status, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId, customerName, customerPhone, customerEmail, JSON.stringify(items),
        subtotal, tax, total, locationId, estimatedTime, timeRemaining,
        'pending_payment', userId
      ]
    )

    // Add initial status to history
    await query(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, 'pending_payment']
    )

    res.json({ 
      success: true, 
      orderId,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Error creating order:', error)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// Get all orders (for admin dashboard)
app.get('/api/orders', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM orders ORDER by order_date DESC')
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date)
    }))
    res.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})

// Get specific order by ID
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params
    const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
    
    if (!row) {
      return res.status(404).json({ error: 'Order not found' })
    }

    const order = {
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date)
    }
    res.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    res.status(500).json({ error: 'Failed to fetch order' })
  }
})

// Get orders for a specific customer
app.get('/api/customers/:customerId/orders', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params

    // Check if the requesting user is the customer or an admin
    if (req.user.role !== 'admin' && req.user.id !== customerId) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const rows = await queryAll(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC',
      [customerId]
    )
    
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items),
      orderTime: new Date(row.order_date)
    }))
    res.json(orders)
  } catch (error) {
    console.error('Error fetching customer orders:', error)
    res.status(500).json({ error: 'Failed to fetch customer orders' })
  }
})

// Update order status
app.put('/api/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params
    const { status, timeRemaining } = req.body

    if (!status) {
      return res.status(400).json({ error: 'Status is required' })
    }

    const updateQuery = timeRemaining !== undefined
      ? 'UPDATE orders SET status = ?, time_remaining = ? WHERE id = ?'
      : 'UPDATE orders SET status = ? WHERE id = ?'
    
    const params = timeRemaining !== undefined
      ? [status, timeRemaining, orderId]
      : [status, orderId]

    const result = await query(updateQuery, params)
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' })
    }

    // Add status change to history
    await query(
      'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
      [orderId, status]
    )

    // Get updated order
    const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
    if (row) {
      const updatedOrder = {
        ...row,
        items: JSON.parse(row.items),
        orderTime: new Date(row.order_date)
      }

      // Emit to all connected clients
      io.emit('orderUpdated', updatedOrder)
      res.json(updatedOrder)
    } else {
      res.status(404).json({ error: 'Order not found' })
    }
  } catch (error) {
    console.error('Error updating order status:', error)
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

// Verify payment and update order
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { sessionId, orderId } = req.body

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === 'paid') {
      // Update order status to confirmed and payment to completed
      await query(
        'UPDATE orders SET payment_status = ?, status = ? WHERE id = ?',
        ['completed', 'confirmed', orderId]
      )

      // Add status change to history
      await query(
        'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
        [orderId, 'confirmed']
      )

      // Get updated order and notify admin
      const row = await queryOne('SELECT * FROM orders WHERE id = ?', [orderId])
      if (row) {
        const updatedOrder = {
          ...row,
          items: JSON.parse(row.items),
          orderTime: new Date(row.order_date)
        }

        // Notify admin of new paid order
        io.to('admin').emit('new-order', updatedOrder)
        io.to(`order-${orderId}`).emit('order-status-updated', updatedOrder)
      }

      res.json({ success: true, paymentStatus: 'completed' })
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
      query(
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
app.get('/api/menu', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM menu_items ORDER BY category, name')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching menu items:', error)
    res.status(500).json({ error: 'Failed to fetch menu items' })
  }
})

// Add new menu item
app.post('/api/menu', async (req, res) => {
  try {
    const { name, description, price, category, emoji, available, image_url } = req.body

    if (!name || !price || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' })
    }

    const result = await query(
      'INSERT INTO menu_items (name, description, price, category, emoji, available, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, description, price, category, emoji, available !== false, image_url]
    )

    // Return the created item
    const row = await queryOne('SELECT * FROM menu_items WHERE id = ?', [result.lastID])
    res.json(row)
  } catch (error) {
    console.error('Error adding menu item:', error)
    res.status(500).json({ error: 'Failed to add menu item' })
  }
})

// Update menu item
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, category, emoji, available, image_url } = req.body
    
    await query(
      'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, emoji = ?, available = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, price, category, emoji, available, image_url, id]
    )

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating menu item:', error)
    res.status(500).json({ error: 'Failed to update menu item' })
  }
})

// Delete menu item
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await query('DELETE FROM menu_items WHERE id = ?', [id])
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Menu item not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting menu item:', error)
    res.status(500).json({ error: 'Failed to delete menu item' })
  }
})

// Locations API Routes

// Get all locations
app.get('/api/locations', async (req, res) => {
  try {
    const rows = await queryAll('SELECT * FROM locations ORDER BY name')
    res.json(rows)
  } catch (error) {
    console.error('Error fetching locations:', error)
    res.status(500).json({ error: 'Failed to fetch locations' })
  }
})

// Add new location
app.post('/api/locations', async (req, res) => {
  try {
    const { id, name, type, description, current_location, schedule, phone, status } = req.body
    
    if (!id || !name) {
      return res.status(400).json({ error: 'ID and name are required' })
    }

    await query(
      'INSERT INTO locations (id, name, type, description, current_location, schedule, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, type || 'mobile', description, current_location, schedule, phone, status || 'active']
    )

    // Return the created item
    const createdLocation = await queryOne('SELECT * FROM locations WHERE id = ?', [id])
    res.json(createdLocation)
  } catch (error) {
    console.error('Error adding location:', error)
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY' || error.code === '23505') {
      res.status(400).json({ error: 'Location ID already exists' })
    } else {
      res.status(500).json({ error: 'Failed to add location' })
    }
  }
})

// Update location
app.put('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { name, type, description, current_location, schedule, phone, status } = req.body
    
    const result = await query(
      'UPDATE locations SET name = ?, type = ?, description = ?, current_location = ?, schedule = ?, phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, type, description, current_location, schedule, phone, status, id]
    )

    if (result.changes === 0) {
      res.status(404).json({ error: 'Location not found' })
    } else {
      res.json({ success: true, changes: result.changes })
    }
  } catch (error) {
    console.error('Error updating location:', error)
    res.status(500).json({ error: 'Failed to update location' })
  }
})

// Delete location
app.delete('/api/locations/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await query('DELETE FROM locations WHERE id = ?', [id])
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Location not found' })
    } else {
      res.json({ success: true, changes: result.changes })
    }
  } catch (error) {
    console.error('Error deleting location:', error)
    res.status(500).json({ error: 'Failed to delete location' })
  }
})

// Timer to update cooking orders - start after database is ready
setTimeout(() => {
  console.log('🕐 Starting cooking timer...')
  setInterval(async () => {
    try {
      console.log('🔄 Timer running - checking cooking orders...')
      // Simplified query to debug SQL syntax
      const rows = await queryAll('SELECT * FROM orders WHERE status = ? AND time_remaining > 0', ['cooking'])
      console.log(`📊 Found ${rows.length} cooking orders`)
      
      for (const order of rows) {
        const newTimeRemaining = Math.max(0, order.time_remaining - 1)
        const newStatus = newTimeRemaining === 0 ? 'ready' : 'cooking'

        await query(
          'UPDATE orders SET time_remaining = ?, status = ? WHERE id = ?',
          [newTimeRemaining, newStatus, order.id]
        )
        
        if (newStatus === 'ready') {
          // Add status change to history
          await query(
            'INSERT INTO order_status_history (order_id, status) VALUES (?, ?)',
            [order.id, 'ready']
          )
        }

        // Get updated order and emit to clients
        const updatedRow = await queryOne('SELECT * FROM orders WHERE id = ?', [order.id])
        if (updatedRow) {
          const updatedOrder = {
            ...updatedRow,
            items: JSON.parse(updatedRow.items),
            orderTime: new Date(updatedRow.order_date)
          }

          io.to('admin').emit('order-updated', updatedOrder)
          io.to(`order-${order.id}`).emit('order-status-updated', updatedOrder)
        }
      }
    } catch (error) {
      console.error('Timer error:', error)
    }
  }, 60000) // Update every minute
}, 5000) // Wait 5 seconds after server start

// Dashboard API Route
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get counts and statistics from database
    const orderCount = await queryOne('SELECT COUNT(*) as total_orders FROM orders')
    const menuCount = await queryOne('SELECT COUNT(*) as total_menu_items FROM menu_items')
    const locationCount = await queryOne('SELECT COUNT(*) as total_locations FROM locations')
    
    // Get recent orders
    const recentOrders = await queryAll('SELECT * FROM orders ORDER BY order_date DESC LIMIT 5')
    
    // Get order status distribution
    const statusDistribution = await queryAll('SELECT status, COUNT(*) as count FROM orders GROUP BY status')

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
        orderTime: new Date(order.order_date)
      })),
      orderStatusDistribution: statusDistribution
    }

    res.json(dashboardData)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    res.status(500).json({ error: 'Failed to fetch dashboard data' })
  }
})

// Authentication Routes

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, phone, password, role = 'customer', firstName, lastName } = req.body

    if (!email || !phone || !password) {
      return res.status(400).json({ error: 'Email, phone, and password are required' })
    }

    // Check if user already exists
    const existingUser = await queryOne(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    )

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Create user
    const userId = `USER-${uuidv4().substring(0, 8).toUpperCase()}`
    await query(
      'INSERT INTO users (id, email, phone, password_hash, role, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email, phone, passwordHash, role, firstName, lastName]
    )

    // Create profile based on role
    if (role === 'customer') {
      await query('INSERT INTO customer_profiles (user_id) VALUES (?)', [userId])
    } else if (role === 'admin') {
      await query('INSERT INTO admin_profiles (user_id) VALUES (?)', [userId])
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: userId, email, role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Store refresh token
    await query(
      'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, NOW() + INTERVAL \'7 days\')',
      [uuidv4(), userId, refreshToken, 'refresh']
    )

    res.json({
      success: true,
      user: {
        id: userId,
        email,
        phone,
        role,
        firstName,
        lastName
      },
      accessToken,
      refreshToken
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

    if ((!email && !phone) || !password) {
      return res.status(400).json({ error: 'Email/phone and password are required' })
    }

    // Find user
    const user = await queryOne(
      'SELECT * FROM users WHERE email = ? OR phone = ?',
      [email || phone, phone || email]
    )

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '1h' }
    )

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    )

    // Store refresh token
    await query(
      'INSERT INTO auth_tokens (id, user_id, token, type, expires_at) VALUES (?, ?, ?, ?, NOW() + INTERVAL \'7 days\')',
      [uuidv4(), user.id, refreshToken, 'refresh']
    )

    // Update last login for admin
    if (user.role === 'admin') {
      await query(
        'UPDATE admin_profiles SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?',
        [user.id]
      )
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name
      },
      accessToken,
      refreshToken
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
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'fallback-secret')

    // Check if token exists in database
    const token = await queryOne(
      'SELECT * FROM auth_tokens WHERE token = ? AND type = ? AND expires_at > CURRENT_TIMESTAMP',
      [refreshToken, 'refresh']
    )

    if (!token) {
      return res.status(401).json({ error: 'Invalid refresh token' })
    }

    // Get user
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id]
    )

    if (!user) {
      return res.status(401).json({ error: 'User not found' })
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
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
      await query(
        'DELETE FROM auth_tokens WHERE token = ? AND user_id = ?',
        [refreshToken, req.user.id]
      )
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
    const user = await queryOne(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    )

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