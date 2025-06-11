import React, { useState, useEffect } from 'react'
import { CheckCircle, Clock, ChefHat, Bell, MapPin, Phone, AlertCircle } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import ApiService from '../services/api'
import SocketService from '../services/socket'
import './OrderTrackingPage.css'

const OrderTrackingPage = () => {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [paymentVerified, setPaymentVerified] = useState(false)

  // Get order ID and session ID from URL params or localStorage
  const orderId = searchParams.get('order_id') || searchParams.get('orderId') || localStorage.getItem('currentOrderId')
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

  const getStatusStep = (status) => {
    switch (status) {
      case 'pending_payment': return 0
      case 'pending': return 1
      case 'confirmed': return 2
      case 'cooking': return 3
      case 'ready': return 4
      case 'completed': return 5
      default: return 1
    }
  }

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const calculateEstimatedReady = (order) => {
    if (!order || order.status !== 'cooking') return null
    
    const orderTime = new Date(order.order_time)
    const estimatedReady = new Date(orderTime.getTime() + order.estimated_time * 60000)
    return estimatedReady
  }

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

  const currentStep = getStatusStep(order.status)
  const estimatedReady = calculateEstimatedReady(order)

  const steps = [
    { 
      id: 1, 
      title: 'Order Placed', 
      description: 'Your order has been received',
      icon: <CheckCircle size={24} />,
      time: formatTime(order.order_time)
    },
    { 
      id: 2, 
      title: 'Payment Confirmed', 
      description: 'Payment processed successfully',
      icon: <CheckCircle size={24} />,
      time: currentStep >= 2 ? formatTime(order.order_time) : null
    },
    { 
      id: 3, 
      title: 'Preparing Food', 
      description: 'Your delicious meal is being prepared',
      icon: <ChefHat size={24} />,
      time: currentStep >= 3 ? formatTime(order.order_time) : null
    },
    { 
      id: 4, 
      title: 'Ready for Pickup', 
      description: 'Your order is ready! Come get it while it\'s hot',
      icon: <Bell size={24} />,
      time: currentStep >= 4 ? (estimatedReady ? formatTime(estimatedReady) : 'Ready now!') : null
    },
    { 
      id: 5, 
      title: 'Order Complete', 
      description: 'Thank you for choosing Fernando\'s!',
      icon: <CheckCircle size={24} />,
      time: currentStep >= 5 ? formatTime(new Date()) : null
    }
  ]

  const getStepStatus = (stepId) => {
    if (stepId < currentStep) return 'completed'
    if (stepId === currentStep) return 'active'
    return 'pending'
  }

  return (
    <div className="order-tracking-page">
      <div className="container">
        <div className="tracking-header">
          <h1>Order Tracking</h1>
          <div className="order-info">
            <div className="order-number">
              <strong>Order #{order.id}</strong>
            </div>
            <div className="order-customer">
              <span>for {order.customer_name}</span>
            </div>
          </div>
        </div>

        {/* Payment Success Message */}
        {sessionId && order.payment_status === 'completed' && (
          <div className="payment-success-banner">
            <CheckCircle size={20} />
            <span>Payment successful! Your order is confirmed.</span>
          </div>
        )}

        {/* Payment Pending Warning */}
        {order.status === 'pending_payment' && (
          <div className="payment-pending-banner">
            <AlertCircle size={20} />
            <span>Payment is still being processed. Your order will be confirmed once payment is complete.</span>
          </div>
        )}

        <div className="tracking-content">
          <div className="tracking-main">
            {/* Current Status Card */}
            <div className="current-status-card">
              <div className="status-header">
                <h2>Current Status</h2>
                <div className={`status-badge ${order.status}`}>
                  {order.status === 'cooking' && <ChefHat size={16} />}
                  {order.status === 'ready' && <Bell size={16} />}
                  {order.status === 'confirmed' && <CheckCircle size={16} />}
                  {order.status === 'pending' && <Clock size={16} />}
                  {order.status === 'pending_payment' && <Clock size={16} />}
                  {order.status === 'completed' && <CheckCircle size={16} />}
                  {order.status === 'pending_payment' ? 'Awaiting Payment' : 
                   order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </div>
              </div>

              {order.status === 'cooking' && order.time_remaining > 0 && (
                <div className="cooking-progress">
                  <div className="progress-info">
                    <span className="time-remaining">{order.time_remaining} minutes remaining</span>
                    <span className="estimated-ready">
                      Ready by {estimatedReady ? formatTime(estimatedReady) : 'Soon!'}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${((order.estimated_time - order.time_remaining) / order.estimated_time) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <div className="cooking-animation">
                    <span className="cooking-emoji">👨‍🍳</span>
                    <span className="cooking-text">Our chef is preparing your order...</span>
                  </div>
                </div>
              )}

              {order.status === 'ready' && (
                <div className="ready-notification">
                  <div className="ready-icon">🔔</div>
                  <h3>Your order is ready!</h3>
                  <p>Please come to the pickup location to collect your delicious meal.</p>
                </div>
              )}

              {order.status === 'completed' && (
                <div className="completed-notification">
                  <div className="completed-icon">✅</div>
                  <h3>Order Complete!</h3>
                  <p>Thank you for choosing Fernando's! We hope you enjoyed your meal.</p>
                </div>
              )}
            </div>

            {/* Progress Steps */}
            <div className="progress-steps">
              <h3>Order Progress</h3>
              <div className="steps-container">
                {steps.map((step, index) => (
                  <div key={step.id} className={`step ${getStepStatus(step.id)}`}>
                    <div className="step-connector">
                      {index < steps.length - 1 && (
                        <div className={`connector-line ${currentStep > step.id ? 'completed' : ''}`}></div>
                      )}
                    </div>
                    <div className="step-content">
                      <div className="step-icon">
                        {step.icon}
                      </div>
                      <div className="step-details">
                        <h4>{step.title}</h4>
                        <p>{step.description}</p>
                        {step.time && (
                          <span className="step-time">{step.time}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="tracking-sidebar">
            <div className="order-details-card">
              <h3>Order Details</h3>
              <div className="order-items">
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-info">
                      <span className="item-emoji">{item.emoji || '🍽️'}</span>
                      <div className="item-details">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                    </div>
                    <span className="item-price">${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-summary">
                <div className="summary-line">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="summary-line">
                  <span>Tax:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="summary-line total">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pickup-info-card">
              <h3>Pickup Information</h3>
              <div className="pickup-details">
                <div className="pickup-location">
                  <MapPin size={20} />
                  <div>
                    <strong>Fernando's Food Truck</strong>
                    <p>Campus Town - Green & Wright</p>
                  </div>
                </div>
                <div className="pickup-contact">
                  <Phone size={20} />
                  <div>
                    <strong>Contact</strong>
                    <p>(217) 255-0210</p>
                  </div>
                </div>
              </div>
              
              {order.status === 'ready' && (
                <div className="pickup-reminder">
                  <Bell size={16} />
                  <span>Please pickup within 15 minutes to ensure food quality</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderTrackingPage 