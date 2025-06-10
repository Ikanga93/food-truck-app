import React, { useState } from 'react'
import { Menu, X, ShoppingCart } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo'
import './Header.css'

const Header = ({ cartItems, onCartOpen }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      // If not on home page, navigate to home first
      window.location.href = `/#${sectionId}`
      return
    }
    
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
          <Link to="/" className="logo">
            <div className="logo-text">
              <h1>Fernando's</h1>
              <span>Auténtica Comida Mexicana</span>
            </div>
            <Logo size={50} className="logo-image" />
          </Link>
          
          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="/menu" onClick={() => setIsMenuOpen(false)}>Place Order</Link>
            <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
            <Link to="/catering" onClick={() => setIsMenuOpen(false)}>Events</Link>
            <Link to="/location" onClick={() => setIsMenuOpen(false)}>Find Us</Link>
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