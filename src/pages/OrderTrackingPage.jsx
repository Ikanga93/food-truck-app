import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, ChefHat, Bell, MapPin, AlertCircle } from 'lucide-react'
import { useSearchParams, useParams } from 'react-router-dom'
import ApiService from '../services/api'
import SocketService from '../services/socket'
import './OrderTrackingPage.css'

const OrderTrackingPage = () => {
  const [searchParams] = useSearchParams()
  const { orderId: urlOrderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentVerified, setPaymentVerified] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Get order ID from URL path parameter, query parameter, or localStorage
  const orderId = urlOrderId || searchParams.get('order_id') || searchParams.get('orderId') || localStorage.getItem('currentOrderId')
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const loadOrder = async () => {
      if (!orderId) {
        setError('No order ID provided')
        setIsLoading(false)
        return
      }

      try {
        // If we have a session ID, verify payment first
        if (sessionId && !paymentVerified) {
          console.log('Verifying payment for session:', sessionId)
          try {
            await ApiService.verifyPayment(sessionId, orderId)
            setPaymentVerified(true)
            console.log('Payment verified successfully')
          } catch (paymentError) {
            console.error('Payment verification failed:', paymentError)
            // Continue loading order even if payment verification fails
          }
        }

        // Connect to Socket.IO for real-time updates
        SocketService.connect()
        SocketService.joinOrderTracking(orderId)

        // Load order data
        const orderData = await ApiService.getOrder(orderId)
        setOrder(orderData)
        setIsLoading(false)

        // Set up real-time listener for order updates
        SocketService.onOrderStatusUpdated((updatedOrder) => {
          if (updatedOrder.id === orderId) {
            console.log('Order status updated:', updatedOrder)
            setOrder(updatedOrder)
          }
        })

      } catch (error) {
        console.error('Error loading order:', error)
        setError('Failed to load order. Please check your order ID.')
        setIsLoading(false)
      }
    }

    loadOrder()

    // Cleanup on unmount
    return () => {
      SocketService.removeListener('order-status-updated')
      SocketService.disconnect()
    }
  }, [orderId, sessionId, paymentVerified])

  // Helper function to get current time in Central Time
  const getCurrentCentralTime = () => {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Chicago"}))
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })
  }

  const getEstimatedTimeRemaining = (order) => {
    if (!order) return null
    
    const estimatedTime = order.estimated_time || 20 // Default to 20 minutes
    const orderTime = new Date(order.orderTime || order.order_time)
    const currentCentralTime = currentTime
    const estimatedReady = new Date(orderTime.getTime() + estimatedTime * 60000)
    const remaining = Math.max(0, Math.floor((estimatedReady.getTime() - currentCentralTime.getTime()) / 1000))
    
    if (remaining <= 0) return 'Ready now!'
    
    const minutes = Math.floor(remaining / 60)
    const seconds = remaining % 60
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getProgressPercentage = (order) => {
    if (!order) return 0
    
    const estimatedTime = order.estimated_time || 20 // Default to 20 minutes
    const orderTime = new Date(order.orderTime || order.order_time)
    const currentCentralTime = currentTime
    const elapsed = (currentCentralTime.getTime() - orderTime.getTime()) / 1000 / 60 // elapsed time in minutes
    const progress = Math.min(100, Math.max(0, (elapsed / estimatedTime) * 100))
    
    return Math.round(progress)
  }

  const getElapsedTime = (order) => {
    if (!order) return null
    
    const orderTime = new Date(order.orderTime || order.order_time)
    const currentCentralTime = currentTime
    const elapsed = Math.floor((currentCentralTime.getTime() - orderTime.getTime()) / 1000 / 60) // in minutes
    
    if (elapsed < 60) {
      return `${elapsed} minutes ago`
    } else {
      const hours = Math.floor(elapsed / 60)
      const minutes = elapsed % 60
      return `${hours}h ${minutes}m ago`
    }
  }

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`
  }

  // Timer effect for live updates using Central Time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentCentralTime())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="order-tracking-page">
        <div className="container">
          <div className="loading-state">
            <div className="spinner"></div>
            <h2>Loading your order...</h2>
            <p>Please wait while we fetch your order details.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="order-tracking-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h2>Order Not Found</h2>
            <p>{error || 'We couldn\'t find your order. Please check your order ID.'}</p>
            <button onClick={() => window.location.href = '/'}>
              Return to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'cooking':
        return <ChefHat size={24} />
      case 'ready':
        return <Bell size={24} />
      case 'confirmed':
        return <CheckCircle size={24} />
      case 'completed':
        return <CheckCircle size={24} />
      default:
        return <Clock size={24} />
    }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending_payment':
        return 'Awaiting Payment'
      case 'confirmed':
        return 'Order Confirmed'
      case 'cooking':
        return 'Cooking Your Order'
      case 'ready':
        return 'Ready for Pickup'
      case 'completed':
        return 'Order Complete'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="order-tracking-page">
      <div className="container">
        <div className="tracking-header">
          <h1>Order Tracking</h1>
          <div className="order-info">
            <span className="order-id">Order #{order.id}</span>
            <span className="order-time">Placed {getElapsedTime(order)}</span>
          </div>
        </div>

        {/* Payment Success Message */}
        {sessionId && order.payment_status === 'completed' && (
          <div className="payment-success-banner">
            <CheckCircle size={20} />
            <span>Payment successful! Your order is confirmed.</span>
          </div>
        )}

        {/* Main Status Card */}
        <div className="status-card">
          <div className="status-header">
            <div className="status-icon">
              {getStatusIcon(order.status)}
            </div>
            <div className="status-content">
              <h2 className="status-title">{getStatusLabel(order.status)}</h2>
              <p className="status-subtitle">
                {order.status === 'cooking' && 'Our chefs are preparing your delicious meal'}
                {order.status === 'confirmed' && 'Your order has been confirmed and will be prepared soon'}
                {order.status === 'ready' && 'Your order is ready for pickup!'}
                {order.status === 'completed' && 'Thank you for your order!'}
                {order.status === 'pending_payment' && 'Please complete your payment to proceed'}
              </p>
            </div>
          </div>

          {/* Live Timer and Progress for Active Orders */}
          {(order.status === 'cooking' || order.status === 'confirmed') && (
            <div className="progress-section">
              <div className="timer-display">
                <div className="countdown-timer">
                  <span className="timer-value">{getEstimatedTimeRemaining(order)}</span>
                  <span className="timer-label">estimated remaining</span>
                </div>
                <div className="progress-details">
                  <span className="progress-percentage">{getProgressPercentage(order)}% complete</span>
                </div>
              </div>
              
              <div className="progress-bar-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getProgressPercentage(order)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary */}
        <div className="order-summary-card">
          <h3>Order Summary</h3>
          <div className="order-items">
            {(typeof order.items === 'string' ? JSON.parse(order.items) : order.items).map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">Qty: {item.quantity || 1}</span>
                </div>
                <span className="item-price">{formatPrice(item.price)}</span>
              </div>
            ))}
          </div>
          <div className="order-total">
            <div className="total-row">
              <span className="total-label">Total</span>
              <span className="total-amount">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        <div className="pickup-info-card">
          <div className="pickup-header">
            <MapPin size={20} />
            <h3>Pickup Location</h3>
          </div>
          <div className="pickup-details">
            <p className="location-name">Fernando's Food Truck</p>
            <p className="location-address">Check our social media for current location</p>
            <p className="pickup-instructions">
              Please have your order number ready when you arrive
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="customer-info-card">
          <h3>Order Details</h3>
          <div className="customer-details">
            <div className="detail-row">
              <span className="detail-label">Customer:</span>
              <span className="detail-value">{order.customer_name}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone:</span>
              <span className="detail-value">{order.customer_phone}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Order Time:</span>
              <span className="detail-value">{formatTime(order.orderTime || order.order_time)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTrackingPage