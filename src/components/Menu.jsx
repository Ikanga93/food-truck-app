import React, { useState } from 'react'
import { Plus, Minus, ShoppingCart } from 'lucide-react'
import './Menu.css'

const Menu = ({ onAddToCart, cartItems }) => {
  const [activeCategory, setActiveCategory] = useState('bestsellers')

  const menuItems = {
    bestsellers: [
      {
        id: 'torta-1',
        name: "Torta",
        price: 8.00,
        description: "Avocado, lettuce, tomato, onion, jalapenos, mayo and cheese.",
        emoji: "🥪",
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
        id: 'chicken',
        name: "Chicken",
        price: 12.00,
        description: "Grilled chicken prepared with authentic Mexican spices",
        emoji: "🍗"
      }
    ],
    tacos: [
      {
        id: 'taco-carnitas',
        name: "Taco de Carnitas",
        price: 3.50,
        description: "Slow-cooked pork with onions, cilantro, and salsa verde",
        emoji: "🌮"
      },
      {
        id: 'taco-asada',
        name: "Taco de Carne Asada",
        price: 4.00,
        description: "Grilled beef with pico de gallo and guacamole",
        emoji: "🌮"
      },
      {
        id: 'taco-pollo',
        name: "Taco de Pollo",
        price: 3.25,
        description: "Marinated chicken with lettuce, cheese, and crema",
        emoji: "🌮"
      }
    ],
    burritos: [
      {
        id: 'burrito-supreme',
        name: "Burrito Supreme",
        price: 9.50,
        description: "Choice of meat, rice, beans, cheese, lettuce, pico, sour cream",
        emoji: "🌯"
      },
      {
        id: 'burrito-carnitas',
        name: "Burrito de Carnitas",
        price: 8.75,
        description: "Carnitas, rice, beans, onions, cilantro, salsa verde",
        emoji: "🌯"
      }
    ],
    sides: [
      {
        id: 'guacamole',
        name: "Guacamole & Chips",
        price: 5.50,
        description: "Fresh avocado dip with crispy tortilla chips",
        emoji: "🥑"
      },
      {
        id: 'horchata',
        name: "Horchata",
        price: 3.00,
        description: "Traditional rice and cinnamon drink",
        emoji: "🥛"
      }
    ]
  }

  const categories = [
    { id: 'bestsellers', name: 'Best Sellers', emoji: '⭐' },
    { id: 'tacos', name: 'Tacos', emoji: '🌮' },
    { id: 'burritos', name: 'Burritos', emoji: '🌯' },
    { id: 'sides', name: 'Sides & Drinks', emoji: '🥑' }
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
        <h2 className="section-title">Our Menu</h2>
        <p className="section-subtitle">
          Authentic Mexican flavors made fresh daily with traditional recipes
        </p>

        <div className="menu-categories">
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-emoji">{category.emoji}</span>
              {category.name}
            </button>
          ))}
        </div>

        <div className="menu-items">
          {menuItems[activeCategory].map((item) => (
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
      </div>
    </section>
  )
}

export default Menu 