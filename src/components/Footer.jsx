import React from 'react'
import { Link } from 'react-router-dom'
import { Phone, Mail, Facebook } from 'lucide-react'
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Fernando's</h3>
            <p>Auténtica Comida Mexicana</p>
            <div className="footer-emoji">🌮❤️🇲🇽</div>
          </div>
          
          <div className="footer-links">
            <div className="footer-section">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/menu">Menu</Link></li>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/catering">Events</Link></li>
                <li><Link to="/location">Location</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contact</h4>
              <div className="contact-icons">
                <a href="tel:+12172550210" className="contact-icon-link" title="Call us">
                  <Phone size={20} />
                </a>
                <a href="mailto:Fernandosfoodtruck1@gmail.com" className="contact-icon-link" title="Email us">
                  <Mail size={20} />
                </a>
                <a href="https://www.facebook.com/FernandosTacosAndMore/" target="_blank" rel="noopener noreferrer" className="contact-icon-link" title="Follow us on Facebook">
                  <Facebook size={20} />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Fernando's Food Truck. Made with ❤️ and lots of spice!</p>
          <Link to="/admin/login" className="admin-access">Staff</Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer 