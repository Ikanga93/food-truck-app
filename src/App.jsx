import React, { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Menu from './components/Menu'
import About from './components/About'
import Location from './components/Location'
import Contact from './components/Contact'
import Footer from './components/Footer'
import Cart from './components/Cart'

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
    <div className="App">
      <Header 
        cartItems={cartItems} 
        onCartOpen={handleCartOpen}
      />
      <Hero />
      <Menu 
        onAddToCart={handleAddToCart}
        cartItems={cartItems}
      />
      <About />
      <Location />
      <Contact />
      <Footer />
      <Cart
        isOpen={isCartOpen}
        onClose={handleCartClose}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  )
}

export default App 