import React, { useState } from 'react'
import { Menu, X, ShoppingCart } from 'lucide-react'
import './Header.css'

const Header = ({ cartItems, onCartOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMenuOpen(false)
  }

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo">
            <h1>Fernando's</h1>
            <span>Auténtica Comida Mexicana</span>
          </div>
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <a href="#home" onClick={() => scrollToSection('home')}>Home</a>
            <a href="#menu" onClick={() => scrollToSection('menu')}>Menu</a>
            <a href="#about" onClick={() => scrollToSection('about')}>About</a>
            <a href="#location" onClick={() => scrollToSection('location')}>Location</a>
            <a href="#contact" onClick={() => scrollToSection('contact')}>Contact</a>
          </nav>

          <div className="header-actions">
            <button className="cart-btn" onClick={onCartOpen}>
              <ShoppingCart size={20} />
              {totalItems > 0 && <span className="cart-count">{totalItems}</span>}
            </button>
            
            <button className="menu-toggle" onClick={toggleMenu}>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header 