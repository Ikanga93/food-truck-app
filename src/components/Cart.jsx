import React, { useState } from 'react'
import { X, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react'
import './Cart.css'

const Cart = ({ isOpen, onClose, cartItems, onUpdateQuantity, onRemoveItem }) => {
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  })

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.0875 // 8.75% tax
  const total = subtotal + tax

  const handleInputChange = (e) => {
    setCustomerInfo({
      ...customerInfo,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckout = (e) => {
    e.preventDefault()
    // Simulate checkout process
    alert(`¡Gracias ${customerInfo.name}! Your order for $${total.toFixed(2)} has been placed. We'll call you at ${customerInfo.phone} when it's ready!`)
    setIsCheckingOut(false)
    setCustomerInfo({ name: '', phone: '', email: '' })
    onClose()
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
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="quantity">{item.quantity}</span>
                        <button 
                          className="quantity-btn"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="cart-item-total">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                      <button 
                        className="remove-btn"
                        onClick={() => onRemoveItem(item.id)}
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
                    >
                      Back to Cart
                    </button>
                    <button type="submit" className="place-order-btn">
                      Place Order - ${total.toFixed(2)}
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