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

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_key')

// Middleware
app.use(cors())
app.use(express.json())

// Initialize SQLite Database
const db = new sqlite3.Database('./server/orders.db')

// Create tables
db.serialize(() => {
  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
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
    payment_status TEXT DEFAULT 'pending'
  )`)

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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`)

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
      success_url: `http://localhost:5173/order-tracking?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/?cancelled=true`,
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
        stripe_session_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        'pending_payment'
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
  const { name, description, price, category, emoji, available } = req.body
  
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Name, price, and category are required' })
  }

  db.run(
    'INSERT INTO menu_items (name, description, price, category, emoji, available) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, price, category, emoji, available !== false],
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
  const { name, description, price, category, emoji, available } = req.body
  
  db.run(
    'UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, emoji = ?, available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description, price, category, emoji, available, id],
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

const PORT = process.env.PORT || 3001

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 