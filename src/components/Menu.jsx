import React, { useState, useEffect } from 'react'
import { ShoppingCart, Plus, Minus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import ApiService from '../services/ApiService'
import './Menu.css'

const Menu = () => {
  const { addToCart } = useCart()
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const items = await ApiService.getMenuItems()
      // Only show available items to customers
      setMenuItems(items.filter(item => item.available))
    } catch (error) {
      console.error('Error loading menu:', error)
      setError('Failed to load menu. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Group items by category
  const groupedItems = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  if (loading) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <h2>Our Menu</h2>
          <div className="loading-state">
            <p>Loading delicious menu items...</p>
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <h2>Our Menu</h2>
          <div className="error-state">
            <p>{error}</p>
            <button onClick={loadMenuItems} className="retry-btn">
              Try Again
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (menuItems.length === 0) {
    return (
      <section className="menu-section" id="menu">
        <div className="container">
          <h2>Our Menu</h2>
          <div className="empty-menu">
            <p>We're updating our menu. Please check back soon!</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="menu-section" id="menu">
      <div className="container">
        <h2>Our Menu</h2>
        <p className="menu-subtitle">Authentic Mexican flavors made fresh daily</p>
        
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="menu-category">
            <h3 className="category-title">{category}</h3>
            <div className="menu-grid">
              {items.map(item => (
                <div key={item.id} className="menu-item">
                  <div className="menu-item-header">
                    <div className="menu-emoji">{item.emoji}</div>
                    <div className="menu-item-info">
                      <h4>{item.name}</h4>
                      <p className="menu-description">{item.description}</p>
                      <span className="menu-price">${item.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <button 
                    className="add-to-cart-btn"
                    onClick={() => addToCart(item)}
                  >
                    <ShoppingCart size={16} />
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Menu 