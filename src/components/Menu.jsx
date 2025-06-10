import React from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router-dom'
import './Menu.css'

const Menu = ({ onAddToCart, cartItems }) => {
  const bestSellers = [
    {
      id: 'tortas',
      name: "Tortas",
      price: 8.00,
      description: "Avocado, lettuce, tomato, onion, jalapeños, mayo and cheese.",
      emoji: "🥙",
      isBestSeller: true
    },
    {
      id: 'mexican-corn',
      name: "Mexican Corn",
      price: 3.00,
      description: "Cheese, mayo and chili pepper.",
      emoji: "🌽"
    },
    {
      id: 'tacos',
      name: "Tacos",
      price: 3.00,
      description: "Mexican: Cilantro & Onion | American: Lettuce, Tomato, Onion & Cheese",
      emoji: "🌮"
    }
  ]

  const getItemQuantity = (itemId) => {
    const cartItem = cartItems.find(item => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const handleAddToCart = (item) => {
    onAddToCart(item)
  }

  return (
    <section id="menu" className="menu section">
      <div className="container">
        <h2 className="section-title">Our Best Sellers</h2>
        <p className="section-subtitle">
          Try our most popular authentic Mexican dishes
        </p>

        <div className="menu-items">
          {bestSellers.map((item) => (
            <div key={item.id} className="menu-item card">
              <div className="item-emoji">{item.emoji}</div>
              <div className="item-content">
                <div className="item-header">
                  <div className="item-title-section">
                    <h3 className="item-name">{item.name}</h3>
                    {item.isBestSeller && <span className="best-seller-badge">Best Seller</span>}
                  </div>
                  <span className="item-price">${item.price.toFixed(2)}</span>
                </div>
                <p className="item-description">{item.description}</p>
                
                <div className="item-actions">
                  {getItemQuantity(item.id) > 0 ? (
                    <div className="quantity-controls">
                      <button 
                        className="quantity-btn"
                        onClick={() => onAddToCart(item, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="quantity">{getItemQuantity(item.id)}</span>
                      <button 
                        className="quantity-btn"
                        onClick={() => onAddToCart(item, 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="add-to-cart-btn"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart size={16} />
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="menu-cta">
          <Link to="/menu" className="btn btn-primary">
            Place Order
          </Link>
        </div>

        <div className="menu-info-section">
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">🚚</div>
              <h4>Fresh Daily</h4>
              <p>All our ingredients are prepared fresh every morning using authentic Mexican recipes</p>
            </div>
            <div className="info-card">
              <div className="info-icon">⏰</div>
              <h4>Quick Service</h4>
              <p>Fast, friendly service without compromising on quality or authenticity</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🌶️</div>
              <h4>Authentic Flavors</h4>
              <p>Traditional Mexican spices and cooking methods passed down through generations</p>
            </div>
          </div>
        </div>

        <div className="event-booking-note">
          <p>Need catering for your event? We bring Fernando's delicious food directly to you!</p>
          <Link to="/catering" className="btn btn-secondary">
            Book Us for Your Event
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Menu 