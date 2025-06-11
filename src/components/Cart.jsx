import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, ShoppingCart, CreditCard, MapPin, Truck, Building } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ApiService from '../services/ApiService'
import { useCart } from '../context/CartContext'
import './Cart.css'

const Cart = ({ isOpen, onClose }) => {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState('')
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      loadLocations()
    }
  }, [isOpen])

  const loadLocations = async () => {
    try {
      const locationsData = await ApiService.getLocations()
      // Only show active locations to customers
      const activeLocations = locationsData.filter(location => location.status === 'active')
      setLocations(activeLocations)
      
      // Auto-select first location if only one available
      if (activeLocations.length === 1) {
        setSelectedLocation(activeLocations[0].id)
      }
    } catch (error) {
      console.error('Error loading locations:', error)
      setError('Failed to load pickup locations')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.0875 // 8.75% tax
  const total = subtotal + tax

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value)
  }

  const getLocationIcon = (type) => {
    switch (type) {
      case 'mobile':
        return <Truck size={16} />
      case 'fixed':
        return <Building size={16} />
      default:
        return <MapPin size={16} />
    }
  }

  const selectedLocationObj = locations.find(loc => loc.id === selectedLocation)

  const handleCheckout = async (e) => {
    e.preventDefault()
    
    if (!selectedLocation) {
      alert('Please select a pickup location')
      return
    }

    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      alert('Please fill in all required fields')
      return
    }

    setIsProcessing(true)

    try {
      // Create order and get Stripe checkout URL
      const orderData = {
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        items: cartItems,
        subtotal,
        tax,
        total,
        locationId: selectedLocation
      }

      const response = await ApiService.createOrder(orderData)
      
      // Store order ID for tracking
      localStorage.setItem('currentOrderId', response.orderId)
      
      // Redirect to Stripe Checkout
      window.location.href = response.checkoutUrl
      
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
      setIsProcessing(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="cart-overlay">
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2>
            <ShoppingCart size={24} />
            Your Order
          </h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="cart-content">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-emoji">🌮</div>
              <p>Your cart is empty</p>
              <span>Add some delicious items to get started!</span>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-emoji">{item.emoji}</div>
                      <div className="cart-item-details">
                        <h4>{item.name}</h4>
                        <p>${item.price.toFixed(2)} each</p>
                      </div>
                    </div>
                    
                    <div className="cart-item-controls">
                      <div className="quantity-controls">
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="cart-item-total">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>Tax (8.75%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              {!isCheckingOut ? (
                <button 
                  className="checkout-btn"
                  onClick={() => setIsCheckingOut(true)}
                >
                  <CreditCard size={18} />
                  Proceed to Checkout
                </button>
              ) : (
                <form className="checkout-form" onSubmit={handleCheckout}>
                  <h3>Pickup Location</h3>
                  
                  {loading ? (
                    <div className="loading-locations">
                      <div className="spinner"></div>
                      <p>Loading locations...</p>
                    </div>
                  ) : (
                    <div className="form-group location-selection">
                      {locations.map((location) => (
                        <label key={location.id} className="location-option">
                          <input
                            type="radio"
                            name="location"
                            value={location.id}
                            checked={selectedLocation === location.id}
                            onChange={handleLocationChange}
                          />
                          <div className="location-info">
                            <div className="location-header">
                              {getLocationIcon(location.type)}
                              <span className="location-name">{location.name}</span>
                            </div>
                            <p className="location-description">{location.description}</p>
                            {location.current_location && (
                              <p className="location-address">
                                📍 {location.current_location}
                              </p>
                            )}
                            {location.schedule && (
                              <p className="location-note">🕒 {location.schedule}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  <h3>Customer Information</h3>
                  
                  <div className="form-group">
                    <input
                      type="text"
                      name="name"
                      placeholder="Your Name *"
                      value={customerInfo.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Phone Number *"
                      value={customerInfo.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <input
                      type="email"
                      name="email"
                      placeholder="Email (optional)"
                      value={customerInfo.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="checkout-buttons">
                    <button 
                      type="button" 
                      className="back-btn"
                      onClick={() => setIsCheckingOut(false)}
                      disabled={isProcessing}
                    >
                      Back to Cart
                    </button>
                    <button 
                      type="submit" 
                      className="place-order-btn"
                      disabled={isProcessing || loading}
                    >
                      {isProcessing ? (
                        <>
                          <div className="spinner"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard size={18} />
                          Continue to Payment - ${total.toFixed(2)}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Cart 