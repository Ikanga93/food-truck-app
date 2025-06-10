import React, { useState } from 'react'
import { Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import './MenuPage.css'

const MenuPage = ({ onAddToCart, cartItems }) => {
  const [activeCategory, setActiveCategory] = useState('bestsellers')
  const [searchTerm, setSearchTerm] = useState('')

  const menuItems = {
    bestsellers: [
      {
        id: 'tortas',
        name: "Tortas",
        price: 8.00,
        description: "Avocado, Lettuce, Tomato, Onion, Jalapeños, Mayo & Cheese",
        emoji: "🥙",
        isBestSeller: true,
        ingredients: ["Avocado", "Lettuce", "Tomato", "Onion", "Jalapeños", "Mayo", "Cheese"]
      },
      {
        id: 'mexican-corn',
        name: "Mexican Corn",
        price: 3.00,
        description: "Cheese, Mayo & Chili Pepper",
        emoji: "🌽",
        ingredients: ["Corn", "Cheese", "Mayo", "Chili Pepper"]
      },
      {
        id: 'tacos',
        name: "Tacos",
        price: 3.00,
        description: "Mexican: Cilantro & Onion | American: Lettuce, Tomato, Onion & Cheese",
        emoji: "🌮",
        ingredients: ["Choice of Meat", "Cilantro", "Onion", "Lettuce", "Tomato", "Cheese"]
      }
    ],
    tacos: [
      {
        id: 'taco-mexican',
        name: "Tacos - Mexican Style",
        price: 3.00,
        description: "Cilantro & Onion with your choice of meat",
        emoji: "🌮",
        ingredients: ["Choice of Meat", "Cilantro", "Onion", "Corn Tortilla"]
      },
      {
        id: 'taco-american',
        name: "Tacos - American Style",
        price: 3.00,
        description: "Lettuce, Tomato, Onion & Cheese with your choice of meat",
        emoji: "🌮",
        ingredients: ["Choice of Meat", "Lettuce", "Tomato", "Onion", "Cheese", "Corn Tortilla"]
      }
    ],
    burritos: [
      {
        id: 'burrito-regular',
        name: "Burritos",
        price: 8.00,
        description: "Lettuce, Tomato, Onion, Cheese & Sour Cream",
        emoji: "🌯",
        ingredients: ["Choice of Meat", "Lettuce", "Tomato", "Onion", "Cheese", "Sour Cream"]
      },
      {
        id: 'breakfast-burrito-ham',
        name: "Breakfast Burritos - Ham & Egg",
        price: 8.00,
        description: "Ham & Egg with Lettuce, Tomato, Onion, Cheese & Sour Cream",
        emoji: "🍳",
        ingredients: ["Ham", "Egg", "Lettuce", "Tomato", "Onion", "Cheese", "Sour Cream"]
      },
      {
        id: 'breakfast-burrito-turkey',
        name: "Breakfast Burritos - Turkey & Egg",
        price: 8.00,
        description: "Turkey & Egg with Lettuce, Tomato, Onion, Cheese & Sour Cream",
        emoji: "🍳",
        ingredients: ["Turkey", "Egg", "Lettuce", "Tomato", "Onion", "Cheese", "Sour Cream"]
      },
      {
        id: 'breakfast-burrito-chorizo',
        name: "Breakfast Burritos - Chorizo & Egg",
        price: 8.00,
        description: "Chorizo & Egg with Lettuce, Tomato, Onion, Cheese & Sour Cream",
        emoji: "🍳",
        ingredients: ["Chorizo", "Egg", "Lettuce", "Tomato", "Onion", "Cheese", "Sour Cream"]
      }
    ],
    quesadillas: [
      {
        id: 'quesadilla-cheese',
        name: "Quesadillas",
        price: 8.00,
        description: "Mixed Mozzarella & Provolone Cheese or Try Turkey & Cheese",
        emoji: "🧀",
        ingredients: ["Mozzarella", "Provolone", "Flour Tortilla"]
      }
    ],
    sides: [
      {
        id: 'nachos',
        name: "Nachos",
        price: 9.00,
        description: "Lettuce, Tomato, Onion, Jalapeños, Cheese Sauce & Sour Cream",
        emoji: "🧀",
        ingredients: ["Tortilla Chips", "Lettuce", "Tomato", "Onion", "Jalapeños", "Cheese Sauce", "Sour Cream"]
      },
      {
        id: 'mexican-corn-side',
        name: "Mexican Corn",
        price: 3.00,
        description: "Cheese, Mayo & Chili Pepper",
        emoji: "🌽",
        ingredients: ["Grilled Corn", "Cheese", "Mayo", "Chili Pepper"]
      }
    ],
    drinks: [
      {
        id: 'jarritos',
        name: "Jarritos Mexican Soda",
        price: 3.00,
        description: "Authentic Mexican soda in various flavors",
        emoji: "🥤",
        ingredients: ["Mexican Soda"]
      },
      {
        id: 'coca-cola',
        name: "Coca Cola",
        price: 1.50,
        description: "Ice Cold Coca Cola",
        emoji: "🥤",
        ingredients: ["Coca Cola"]
      },
      {
        id: 'bottled-water',
        name: "Bottled Water",
        price: 1.50,
        description: "Refreshing bottled water",
        emoji: "💧",
        ingredients: ["Bottled Water"]
      }
    ]
  }

  const categories = [
    { id: 'bestsellers', name: 'Best Sellers', emoji: '⭐' },
    { id: 'tacos', name: 'Tacos', emoji: '🌮' },
    { id: 'burritos', name: 'Burritos', emoji: '🌯' },
    { id: 'quesadillas', name: 'Quesadillas', emoji: '🧀' },
    { id: 'sides', name: 'Sides', emoji: '🌽' },
    { id: 'drinks', name: 'Drinks', emoji: '🥤' }
  ]

  const getItemQuantity = (itemId) => {
    const cartItem = cartItems.find(item => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
  }

  const handleAddToCart = (item) => {
    onAddToCart(item)
  }

  // Filter items based on search term
  const filteredItems = menuItems[activeCategory].filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="menu-page-title">Fernando's Menu</h1>
          <p className="menu-page-subtitle">
            Authentic Mexican flavors made fresh daily with traditional family recipes
          </p>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="menu-content">
        <div className="container">
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

          <div className="menu-grid">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div key={item.id} className="menu-card">
                  <div className="menu-card-header">
                    <div className="item-emoji">{item.emoji}</div>
                    {item.isBestSeller && <span className="best-seller-badge">Best Seller</span>}
                  </div>
                  
                  <div className="menu-card-content">
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-description">{item.description}</p>
                    
                    <div className="ingredients">
                      <h4>Ingredients:</h4>
                      <div className="ingredient-tags">
                        {item.ingredients.map((ingredient, index) => (
                          <span key={index} className="ingredient-tag">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="menu-card-footer">
                    <div className="price-section">
                      <span className="item-price">${item.price.toFixed(2)}</span>
                    </div>
                    
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
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-emoji">🔍</div>
                <p>No items found matching "{searchTerm}"</p>
                <button 
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MenuPage 