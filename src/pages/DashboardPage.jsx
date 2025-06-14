import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  MapPin, 
  Clock, 
  Menu as MenuIcon, 
  ShoppingBag, 
  Users, 
  Edit3, 
  Save, 
  Plus, 
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Timer,
  Truck,
  Building,
  Phone
} from 'lucide-react'
import { useBusinessConfig } from '../context/BusinessContext'
import DashboardHeader from '../components/DashboardHeader'
import ApiService from '../services/ApiService'
import io from 'socket.io-client'
import API_BASE_URL from '../config/api.js'
import './DashboardPage.css'

const DashboardPage = ({ onLogout }) => {
  const { config } = useBusinessConfig()
  const [activeTab, setActiveTab] = useState('orders')
  const [orders, setOrders] = useState([])
  const [socket, setSocket] = useState(null)
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [businessSettings, setBusinessSettings] = useState({
    businessName: config.businessName,
    tagline: config.tagline,
    phone: config.contact.phone,
    email: config.contact.email,
    facebook: config.contact.socialMedia.facebook
  })

  // Dynamic menu items from database
  const [menuItems, setMenuItems] = useState([])
  const [isLoadingMenu, setIsLoadingMenu] = useState(false)

  // Dynamic locations from database
  const [locations, setLocations] = useState([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  // Modal states
  const [showMenuModal, setShowMenuModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [editingLocation, setEditingLocation] = useState(null)

  // Form states
  const [menuForm, setMenuForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    emoji: '',
    available: true,
    image_url: '',
    imageFile: null
  })

  const [locationForm, setLocationForm] = useState({
    id: '',
    name: '',
    type: 'mobile',
    description: '',
    current_location: '',
    schedule: '',
    phone: '',
    status: 'active'
  })

  // Initialize Socket.IO and load data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setIsLoading(true)
        
        // Load initial data in parallel
        await Promise.all([
          loadOrders(),
          loadMenuItems(),
          loadLocations()
        ])

        // Try to connect to Socket.IO for real-time updates (optional)
        try {
          const newSocket = io(API_BASE_URL)
          setSocket(newSocket)

          // Listen for real-time order updates
          newSocket.on('orderUpdate', (updatedOrder) => {
            setOrders(prevOrders =>
              prevOrders.map(order =>
                order.id === updatedOrder.id ? updatedOrder : order
              )
            )
          })
        } catch (socketError) {
          console.warn('Socket.IO connection failed, continuing without real-time updates:', socketError)
        }

        setError(null)
      } catch (error) {
        console.error('Error initializing dashboard:', error)
        setError('Failed to load dashboard data. Please refresh the page.')
      } finally {
        setIsLoading(false)
      }
    }

    initializeDashboard()

    return () => {
      if (socket) {
        socket.close()
      }
    }
  }, [])

  // Load functions
  const loadOrders = async () => {
    try {
      setIsLoadingOrders(true)
      const ordersData = await ApiService.getOrders()
      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
      throw error // Re-throw to be caught by the main error handler
    } finally {
      setIsLoadingOrders(false)
    }
  }

  const loadMenuItems = async () => {
    try {
      setIsLoadingMenu(true)
      const menuData = await ApiService.getMenuItems()
      setMenuItems(menuData)
    } catch (error) {
      console.error('Error loading menu items:', error)
      throw error // Re-throw to be caught by the main error handler
    } finally {
      setIsLoadingMenu(false)
    }
  }

  const loadLocations = async () => {
    try {
      setIsLoadingLocations(true)
      const locationsData = await ApiService.getLocations()
      setLocations(locationsData)
    } catch (error) {
      console.error('Error loading locations:', error)
      throw error // Re-throw to be caught by the main error handler
    } finally {
      setIsLoadingLocations(false)
    }
  }

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await ApiService.updateOrderStatus(orderId, newStatus)
      
      // Update local state immediately for better UX
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId 
            ? { 
                ...order, 
                status: newStatus,
                time_remaining: newStatus === 'cooking' ? order.estimated_time : order.time_remaining
              }
            : order
        )
      )
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status. Please try again.')
    }
  }

  const handleMenuItemToggle = async (itemId) => {
    try {
      const item = menuItems.find(item => item.id === itemId)
      const newAvailability = !item.available
      
      await ApiService.updateMenuItem(itemId, { available: newAvailability })
      
      setMenuItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, available: newAvailability } : item
        )
      )
    } catch (error) {
      console.error('Error updating menu item:', error)
      alert('Failed to update menu item. Please try again.')
    }
  }

  const handleAddMenuItem = async (newItem) => {
    try {
      const addedItem = await ApiService.addMenuItem(newItem)
      setMenuItems(prevItems => [...prevItems, addedItem])
    } catch (error) {
      console.error('Error adding menu item:', error)
      alert('Failed to add menu item. Please try again.')
    }
  }

  const handleUpdateLocation = async (locationId, updates) => {
    try {
      await ApiService.updateLocation(locationId, updates)
      setLocations(prevLocations =>
        prevLocations.map(location =>
          location.id === locationId ? { ...location, ...updates } : location
        )
      )
    } catch (error) {
      console.error('Error updating location:', error)
      alert('Failed to update location. Please try again.')
    }
  }

  // Menu item modal functions
  const openAddMenuModal = () => {
    setEditingMenuItem(null)
    setMenuForm({
      name: '',
      description: '',
      price: '',
      category: '',
      emoji: '',
      available: true,
      image_url: '',
      imageFile: null
    })
    setShowMenuModal(true)
  }

  const openEditMenuModal = (item) => {
    setEditingMenuItem(item)
    setMenuForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      emoji: item.emoji,
      available: item.available,
      image_url: item.image_url || '',
      imageFile: null
    })
    setShowMenuModal(true)
  }

  const closeMenuModal = () => {
    setShowMenuModal(false)
    setEditingMenuItem(null)
  }

  const handleMenuFormChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (name === 'imageFile') {
      setMenuForm(prev => ({ ...prev, imageFile: files[0] }))
    } else {
      setMenuForm(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const uploadImage = async (imageFile) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    
    const response = await fetch(`${API_BASE_URL}/api/upload-menu-image`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) {
      throw new Error('Failed to upload image')
    }
    
    const data = await response.json()
    return data.imageUrl
  }

  const handleMenuSubmit = async (e) => {
    e.preventDefault()
    
    if (!menuForm.name || !menuForm.price || !menuForm.category) {
      alert('Please fill in all required fields')
      return
    }

    try {
      let imageUrl = menuForm.image_url

      // Upload new image if selected
      if (menuForm.imageFile) {
        imageUrl = await uploadImage(menuForm.imageFile)
      }

      const menuData = {
        name: menuForm.name,
        description: menuForm.description,
        price: parseFloat(menuForm.price),
        category: menuForm.category,
        emoji: menuForm.emoji,
        available: menuForm.available,
        image_url: imageUrl
      }

      if (editingMenuItem) {
        // Update existing item
        await ApiService.updateMenuItem(editingMenuItem.id, menuData)
      } else {
        // Add new item
        await ApiService.addMenuItem(menuData)
      }

      // Refresh menu items
      await loadMenuItems()
      closeMenuModal()
    } catch (error) {
      console.error('Error saving menu item:', error)
      alert('Failed to save menu item. Please try again.')
    }
  }

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) {
      return
    }

    try {
      await ApiService.deleteMenuItem(itemId)
      setMenuItems(prevItems => prevItems.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error deleting menu item:', error)
      alert('Failed to delete menu item. Please try again.')
    }
  }

  // Location modal functions
  const openAddLocationModal = () => {
    setEditingLocation(null)
    setLocationForm({
      id: '',
      name: '',
      type: 'mobile',
      description: '',
      current_location: '',
      schedule: '',
      phone: '',
      status: 'active'
    })
    setShowLocationModal(true)
  }

  const openEditLocationModal = (location) => {
    setEditingLocation(location)
    setLocationForm({
      id: location.id,
      name: location.name,
      type: location.type,
      description: location.description || '',
      current_location: location.current_location || '',
      schedule: location.schedule || '',
      phone: location.phone || '',
      status: location.status
    })
    setShowLocationModal(true)
  }

  const closeLocationModal = () => {
    setShowLocationModal(false)
    setEditingLocation(null)
  }

  const handleLocationFormChange = (e) => {
    const { name, value } = e.target
    setLocationForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleLocationSubmit = async (e) => {
    e.preventDefault()
    
    if (!locationForm.name.trim() || !locationForm.id.trim()) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const locationData = {
        id: locationForm.id.trim(),
        name: locationForm.name.trim(),
        type: locationForm.type,
        description: locationForm.description.trim(),
        current_location: locationForm.current_location.trim(),
        schedule: locationForm.schedule.trim(),
        phone: locationForm.phone.trim(),
        status: locationForm.status
      }

      if (editingLocation) {
        // Update existing location
        await ApiService.updateLocation(editingLocation.id, locationData)
        setLocations(prevLocations =>
          prevLocations.map(location =>
            location.id === editingLocation.id ? { ...location, ...locationData } : location
          )
        )
      } else {
        // Add new location
        const newLocation = await ApiService.addLocation(locationData)
        setLocations(prevLocations => [...prevLocations, newLocation])
      }

      closeLocationModal()
    } catch (error) {
      console.error('Error saving location:', error)
      alert('Failed to save location. Please try again.')
    }
  }

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return
    }

    try {
      await ApiService.deleteLocation(locationId)
      setLocations(prevLocations => prevLocations.filter(location => location.id !== locationId))
    } catch (error) {
      console.error('Error deleting location:', error)
      alert('Failed to delete location. Please try again.')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending_payment': return '#ff9800'
      case 'pending': return '#ff9800'
      case 'confirmed': return '#2196f3'
      case 'cooking': return '#ff5722'
      case 'ready': return '#4caf50'
      case 'completed': return '#9e9e9e'
      default: return '#757575'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending_payment': return <AlertCircle size={16} />
      case 'pending': return <AlertCircle size={16} />
      case 'confirmed': return <CheckCircle size={16} />
      case 'cooking': return <Timer size={16} />
      case 'ready': return <CheckCircle size={16} />
      case 'completed': return <CheckCircle size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  const formatOrderTime = (orderTime) => {
    const date = new Date(orderTime)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const renderOrdersTab = () => {
    if (isLoading) {
      return (
        <div className="orders-section">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading orders...</p>
          </div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="orders-section">
          <div className="error-state">
            <AlertCircle size={48} />
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Refresh Page</button>
          </div>
        </div>
      )
    }

    return (
      <div className="orders-section">
        <div className="section-header">
          <h2>Order Management</h2>
          <div className="order-stats">
            <div className="stat-card">
              <span className="stat-number">{orders.filter(o => o.status === 'pending').length}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{orders.filter(o => o.status === 'cooking').length}</span>
              <span className="stat-label">Cooking</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">{orders.filter(o => o.status === 'ready').length}</span>
              <span className="stat-label">Ready</span>
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="no-orders">
            <ShoppingBag size={48} />
            <h3>No orders yet</h3>
            <p>Orders will appear here when customers place them.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map(order => (
              <div key={order.id} className={`order-card ${order.status}`}>
                <div className="order-header">
                  <div className="order-id">#{order.id}</div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.toUpperCase()}
                  </div>
                </div>

                <div className="order-customer">
                  <h3>{order.customer_name}</h3>
                  <p>{order.customer_phone}</p>
                  {order.customer_email && <p>{order.customer_email}</p>}
                  <small>{formatOrderTime(order.order_time)}</small>
                </div>

                <div className="order-items">
                  {order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.quantity}x {item.name}</span>
                      <span>${(item.quantity * item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="order-total">
                  <strong>Total: ${order.total.toFixed(2)}</strong>
                </div>

                {order.status === 'cooking' && order.time_remaining > 0 && (
                  <div className="cooking-timer">
                    <div className="timer-header">
                      <Timer size={16} />
                      <span>Cooking - {order.time_remaining} min remaining</span>
                    </div>
                    <div className="enhanced-progress-bar">
                      <div 
                        className="enhanced-progress-fill"
                        style={{ 
                          width: `${((order.estimated_time - order.time_remaining) / order.estimated_time) * 100}%` 
                        }}
                      >
                        <div className="progress-shine"></div>
                      </div>
                      <div className="progress-text">
                        {Math.round(((order.estimated_time - order.time_remaining) / order.estimated_time) * 100)}%
                      </div>
                    </div>
                  </div>
                )}

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <button 
                      className="btn-confirm"
                      onClick={() => handleOrderStatusChange(order.id, 'confirmed')}
                    >
                      Confirm Order
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button 
                      className="btn-cooking"
                      onClick={() => handleOrderStatusChange(order.id, 'cooking')}
                    >
                      Start Cooking
                    </button>
                  )}
                  {order.status === 'cooking' && (
                    <button 
                      className="btn-complete"
                      onClick={() => handleOrderStatusChange(order.id, 'ready')}
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button 
                      className="btn-complete"
                      onClick={() => handleOrderStatusChange(order.id, 'completed')}
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderMenuTab = () => (
    <div className="menu-section">
      <div className="section-header">
        <h2>Menu Management</h2>
        <button className="btn-add" onClick={openAddMenuModal}>
          <Plus size={18} />
          Add Item
        </button>
      </div>

      {menuItems.length === 0 ? (
        <div className="empty-state">
          <MenuIcon size={48} />
          <h3>No menu items yet</h3>
          <p>Start building your menu by adding your first item.</p>
          <button className="btn-add-first" onClick={openAddMenuModal}>
            <Plus size={18} />
            Add First Menu Item
          </button>
        </div>
      ) : (
        <div className="menu-grid">
          {menuItems.map(item => (
            <div key={item.id} className={`menu-item-card ${!item.available ? 'unavailable' : ''}`}>
              <div className="menu-item-header">
                <div className="menu-emoji">{item.emoji}</div>
                <div className="menu-item-info">
                  <h3>{item.name}</h3>
                  <p className="menu-category">{item.category}</p>
                  <p className="menu-price">${item.price.toFixed(2)}</p>
                </div>
              </div>
              
              <div className="menu-item-actions">
                <button 
                  className={`availability-toggle ${item.available ? 'available' : 'unavailable'}`}
                  onClick={() => handleMenuItemToggle(item.id)}
                >
                  {item.available ? <Eye size={14} /> : <EyeOff size={14} />}
                  {item.available ? 'Available' : 'Unavailable'}
                </button>
                <button className="btn-edit" onClick={() => openEditMenuModal(item)}>
                  <Edit3 size={14} />
                </button>
                <button className="btn-delete" onClick={() => handleDeleteMenuItem(item.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderLocationsTab = () => (
    <div className="locations-section">
      <div className="section-header">
        <h2>Location Management</h2>
        <button className="btn-add" onClick={openAddLocationModal}>
          <Plus size={18} />
          Add Location
        </button>
      </div>

      {locations.length === 0 ? (
        <div className="empty-state">
          <MapPin size={48} />
          <h3>No locations yet</h3>
          <p>Add your first location to start serving customers.</p>
          <button className="btn-add-first" onClick={openAddLocationModal}>
            <Plus size={18} />
            Add First Location
          </button>
        </div>
      ) : (
        <div className="locations-grid">
          {locations.map(location => (
            <div key={location.id} className="location-card">
              <div className="location-header">
                <div className="location-icon">
                  {location.type === 'mobile' ? <Truck size={24} /> : <Building size={24} />}
                </div>
                <div className="location-info">
                  <h3>{location.name}</h3>
                  <p className="location-type">{location.type === 'mobile' ? 'Food Truck' : 'Restaurant'}</p>
                  <div className={`status-badge ${location.status}`}>
                    {location.status}
                  </div>
                </div>
              </div>

              <div className="location-details">
                {location.current_location && (
                  <p><MapPin size={14} /> {location.current_location}</p>
                )}
                {location.schedule && (
                  <p><Clock size={14} /> {location.schedule}</p>
                )}
                {location.phone && (
                  <p><Phone size={14} /> {location.phone}</p>
                )}
              </div>

              <div className="location-actions">
                <button className="btn-edit" onClick={() => openEditLocationModal(location)}>
                  <Edit3 size={14} />
                  Edit
                </button>
                <button className="btn-delete" onClick={() => handleDeleteLocation(location.id)}>
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderSettingsTab = () => (
    <div className="settings-section">
      <div className="section-header">
        <h2>Business Settings</h2>
      </div>

      <form className="settings-form">
        <div className="form-group">
          <label>Business Name</label>
          <input
            type="text"
            value={businessSettings.businessName}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              businessName: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Tagline</label>
          <input
            type="text"
            value={businessSettings.tagline}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              tagline: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={businessSettings.phone}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              phone: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={businessSettings.email}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              email: e.target.value
            })}
          />
        </div>

        <div className="form-group">
          <label>Facebook Page</label>
          <input
            type="url"
            value={businessSettings.facebook}
            onChange={(e) => setBusinessSettings({
              ...businessSettings,
              facebook: e.target.value
            })}
          />
        </div>

        <button type="submit" className="btn-save">
          <Save size={18} />
          Save Changes
        </button>
      </form>
    </div>
  )

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'orders':
        return renderOrdersTab()
      case 'menu':
        return renderMenuTab()
      case 'locations':
        return renderLocationsTab()
      case 'settings':
        return renderSettingsTab()
      default:
        return null
    }
  }

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="dashboard-page">
        <DashboardHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
        <div className="dashboard-main">
          <div className="dashboard-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show error screen if initialization failed
  if (error) {
    return (
      <div className="dashboard-page">
        <DashboardHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={onLogout}
        />
        <div className="dashboard-main">
          <div className="dashboard-content">
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <h3>Dashboard Error</h3>
              <p>{error}</p>
              <button 
                className="btn-primary" 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-page">
      <DashboardHeader 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
      />
      
      <div className="dashboard-main">
        <div className="dashboard-content">
          {renderActiveTab()}
        </div>

        {/* Menu Item Modal */}
        {showMenuModal && (
          <div className="modal-overlay" onClick={closeMenuModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
                <button className="modal-close" onClick={closeMenuModal}>×</button>
              </div>
              
              <form onSubmit={handleMenuSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={menuForm.name}
                      onChange={handleMenuFormChange}
                      required
                      placeholder="e.g., Chicken Tacos"
                    />
                  </div>
                  <div className="form-group">
                    <label>Emoji</label>
                    <input
                      type="text"
                      name="emoji"
                      value={menuForm.emoji}
                      onChange={handleMenuFormChange}
                      placeholder="🌮"
                      maxLength="2"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Item Image</label>
                  <input
                    type="file"
                    name="imageFile"
                    onChange={handleMenuFormChange}
                    accept="image/*"
                    className="file-input"
                  />
                  {menuForm.image_url && (
                    <div className="current-image">
                      <p>Current image:</p>
                      <img 
                        src={`${API_BASE_URL}${menuForm.image_url}`} 
                        alt="Current menu item" 
                        className="preview-image"
                      />
                    </div>
                  )}
                  <small className="form-help">Upload an image to display instead of emoji (JPG, PNG, max 5MB)</small>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={menuForm.description}
                    onChange={handleMenuFormChange}
                    placeholder="Describe your delicious item..."
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Price *</label>
                    <input
                      type="number"
                      name="price"
                      value={menuForm.price}
                      onChange={handleMenuFormChange}
                      required
                      min="0"
                      step="0.01"
                      placeholder="8.99"
                    />
                  </div>
                  <div className="form-group">
                    <label>Category *</label>
                    <input
                      type="text"
                      name="category"
                      value={menuForm.category}
                      onChange={handleMenuFormChange}
                      required
                      placeholder="e.g., Tacos, Burritos, Drinks"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="available"
                      checked={menuForm.available}
                      onChange={handleMenuFormChange}
                    />
                    Available for ordering
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeMenuModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingMenuItem ? 'Update Item' : 'Add Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Location Modal */}
        {showLocationModal && (
          <div className="modal-overlay" onClick={closeLocationModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingLocation ? 'Edit Location' : 'Add Location'}</h3>
                <button className="modal-close" onClick={closeLocationModal}>×</button>
              </div>
              
              <form onSubmit={handleLocationSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Location ID *</label>
                    <input
                      type="text"
                      name="id"
                      value={locationForm.id}
                      onChange={handleLocationFormChange}
                      required
                      placeholder="food-truck-1"
                      disabled={editingLocation}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      name="type"
                      value={locationForm.type}
                      onChange={handleLocationFormChange}
                    >
                      <option value="mobile">Food Truck</option>
                      <option value="restaurant">Restaurant</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={locationForm.name}
                    onChange={handleLocationFormChange}
                    required
                    placeholder="Fernando's Food Truck"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={locationForm.description}
                    onChange={handleLocationFormChange}
                    placeholder="Brief description of this location..."
                    rows="2"
                  />
                </div>

                <div className="form-group">
                  <label>Current Location</label>
                  <input
                    type="text"
                    name="current_location"
                    value={locationForm.current_location}
                    onChange={handleLocationFormChange}
                    placeholder="Campus Town - Green & Wright"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Schedule</label>
                    <input
                      type="text"
                      name="schedule"
                      value={locationForm.schedule}
                      onChange={handleLocationFormChange}
                      placeholder="Mon-Sat: 11AM-9PM"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={locationForm.phone}
                      onChange={handleLocationFormChange}
                      placeholder="(217) 255-0210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={locationForm.status}
                    onChange={handleLocationFormChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={closeLocationModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingLocation ? 'Update Location' : 'Add Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage 