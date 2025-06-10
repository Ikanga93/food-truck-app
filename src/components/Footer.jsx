import React from 'react'
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
                <li><a href="#home">Home</a></li>
                <li><a href="#menu">Menu</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#location">Location</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4>Contact</h4>
              <ul>
                <li>📞 (555) 123-TACO</li>
                <li>📧 hello@fernandosfoodtruck.com</li>
                <li>📱 @FernandosFoodTruck</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2024 Fernando's Food Truck. Made with ❤️ and lots of spice!</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer 