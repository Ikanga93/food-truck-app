import React from 'react'
import { Heart, Award, Users, Star, Clock, MapPin } from 'lucide-react'
import './AboutPage.css'

const AboutPage = () => {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="container">
          <h1 className="page-title">About Fernando's</h1>
          <p className="page-subtitle">
            Bringing authentic Mexican flavors to your neighborhood since 2018
          </p>
        </div>
      </div>

      <section className="about-story section">
        <div className="container">
          <div className="story-content">
            <div className="story-text">
              <h2>Our Story</h2>
              <p className="story-paragraph">
                Founded in 2018 by Fernando Gonzalez, our food truck brings the authentic 
                flavors of Guadalajara to your neighborhood. Fernando learned these recipes 
                from his grandmother, who ran a small taqueria in Mexico for over 40 years.
              </p>
              <p className="story-paragraph">
                Every dish is prepared with the same love and attention to detail that has 
                been passed down through generations. We use only the freshest ingredients 
                and traditional cooking methods to ensure every bite transports you to Mexico.
              </p>
              <p className="story-paragraph">
                What started as a dream to share authentic Mexican cuisine has grown into 
                a beloved community staple. We're proud to serve our neighbors and bring 
                people together through the universal language of delicious food.
              </p>
            </div>
            
            <div className="story-image">
              <div className="chef-illustration">
                👨‍🍳🇲🇽
              </div>
              <div className="quote">
                <p>"La comida es amor hecho visible"</p>
                <span>- Fernando Gonzalez, Owner & Chef</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-features section">
        <div className="container">
          <h2 className="section-title">What Makes Us Special</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Heart />
              </div>
              <div className="feature-content">
                <h3>Made with Love</h3>
                <p>Every dish prepared with passion and traditional family recipes passed down through generations</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Award />
              </div>
              <div className="feature-content">
                <h3>Award Winning</h3>
                <p>Best Food Truck 2023 - City Food Awards. Recognized for authentic flavors and quality</p>
              </div>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Users />
              </div>
              <div className="feature-content">
                <h3>Community Favorite</h3>
                <p>Proudly serving our community for over 5 years with thousands of satisfied customers</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Star />
              </div>
              <div className="feature-content">
                <h3>Fresh Ingredients</h3>
                <p>We source the freshest ingredients daily and prepare everything from scratch</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Clock />
              </div>
              <div className="feature-content">
                <h3>Traditional Methods</h3>
                <p>Using time-honored cooking techniques to ensure authentic taste in every bite</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <MapPin />
              </div>
              <div className="feature-content">
                <h3>Mobile Service</h3>
                <p>We bring the flavors of Mexico directly to your neighborhood and events</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-mission section">
        <div className="container">
          <div className="mission-content">
            <h2>Our Mission</h2>
            <p className="mission-text">
              To share the rich culinary heritage of Mexico with our community, one taco at a time. 
              We believe that food is more than sustenance – it's a way to connect cultures, 
              create memories, and bring joy to everyday moments.
            </p>
            <div className="mission-values">
              <div className="value">
                <h4>Authenticity</h4>
                <p>Staying true to traditional Mexican recipes and cooking methods</p>
              </div>
              <div className="value">
                <h4>Quality</h4>
                <p>Using only the finest ingredients and maintaining high standards</p>
              </div>
              <div className="value">
                <h4>Community</h4>
                <p>Building relationships and serving our neighbors with pride</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage 