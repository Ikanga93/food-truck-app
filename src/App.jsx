import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Cart from './components/Cart'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import LocationPage from './pages/LocationPage'
import AboutPage from './pages/AboutPage'
import CateringPage from './pages/CateringPage'

function App() {
  const [cartItems, setCartItems] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)

  const handleAddToCart = (item, quantityChange = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(cartItem => cartItem.id === item.id)
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantityChange
        if (newQuantity <= 0) {
          return prevItems.filter(cartItem => cartItem.id !== item.id)
        }
        return prevItems.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: newQuantity }
            : cartItem
        )
      } else if (quantityChange > 0) {
        return [...prevItems, { ...item, quantity: quantityChange }]
      }
      
      return prevItems
    })
  }

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId)
      return
    }
    
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    )
  }

  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== itemId))
  }

  const handleCartOpen = () => {
    setIsCartOpen(true)
  }

  const handleCartClose = () => {
    setIsCartOpen(false)
  }

  return (
    <Router>
      <div className="App">
        <Header 
          cartItems={cartItems} 
          onCartOpen={handleCartOpen}
        />
        
        <Routes>
          <Route 
            path="/" 
            element={
              <HomePage 
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
              />
            } 
          />
          <Route 
            path="/menu" 
            element={
              <MenuPage 
                onAddToCart={handleAddToCart}
                cartItems={cartItems}
              />
            } 
          />
          <Route 
            path="/about" 
            element={<AboutPage />} 
          />
          <Route 
            path="/catering" 
            element={<CateringPage />} 
          />
          <Route 
            path="/location" 
            element={<LocationPage />} 
          />
        </Routes>
        
        <Footer />
        
        <Cart
          isOpen={isCartOpen}
          onClose={handleCartClose}
          cartItems={cartItems}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
        />
      </div>
    </Router>
  )
}

export default App 