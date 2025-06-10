import React from 'react'
import { MapPin, Clock, Phone } from 'lucide-react'
import './Hero.css'

const Hero = () => {
  const scrollToMenu = () => {
    const element = document.getElementById('menu')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="hero">
      <div className="hero-background">
        <div className="hero-pattern"></div>
      </div>
      
      <div className="container">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              ¡Bienvenidos a <span>Fernando's!</span>
            </h1>
            <p className="hero-subtitle">
              Authentic Mexican street food made with love and tradition. 
              Experience the true flavors of Mexico right here in your neighborhood.
            </p>
            
            <div className="hero-info">
              <div className="info-item">
                <MapPin className="info-icon" />
                <span>Downtown Food District</span>
              </div>
              <div className="info-item">
                <Clock className="info-icon" />
                <span>Mon-Sat: 11AM-9PM</span>
              </div>
              <div className="info-item">
                <Phone className="info-icon" />
                <span>(555) 123-TACO</span>
              </div>
            </div>

            <div className="hero-buttons">
              <button className="btn btn-primary" onClick={scrollToMenu}>
                View Menu
              </button>
              <a href="#location" className="btn btn-secondary">
                Find Us
              </a>
            </div>
          </div>

          <div className="hero-image">
            <div className="food-truck-illustration">
              🌮🚚
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero 