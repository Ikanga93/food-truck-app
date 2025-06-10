import React from 'react'
import { MapPin, Clock, Calendar } from 'lucide-react'
import './Location.css'

const Location = () => {
  const schedule = [
    { day: 'Monday', location: 'Downtown Plaza', time: '11:00 AM - 3:00 PM' },
    { day: 'Tuesday', location: 'Business District', time: '11:00 AM - 3:00 PM' },
    { day: 'Wednesday', location: 'University Campus', time: '11:00 AM - 8:00 PM' },
    { day: 'Thursday', location: 'City Park', time: '11:00 AM - 3:00 PM' },
    { day: 'Friday', location: 'Downtown Plaza', time: '11:00 AM - 9:00 PM' },
    { day: 'Saturday', location: 'Farmers Market', time: '9:00 AM - 4:00 PM' },
    { day: 'Sunday', location: 'Food Truck Festival', time: '12:00 PM - 6:00 PM' }
  ]

  return (
    <section id="location" className="location section">
      <div className="container">
        <h2 className="section-title">Find Us</h2>
        <p className="section-subtitle">
          We're always on the move! Check our weekly schedule to find Fernando's near you.
        </p>

        <div className="location-content">
          <div className="schedule-card card">
            <div className="card-header">
              <Calendar className="card-icon" />
              <h3>Weekly Schedule</h3>
            </div>
            
            <div className="schedule-list">
              {schedule.map((item, index) => (
                <div key={index} className="schedule-item">
                  <div className="schedule-day">
                    <strong>{item.day}</strong>
                  </div>
                  <div className="schedule-details">
                    <div className="schedule-location">
                      <MapPin size={16} />
                      <span>{item.location}</span>
                    </div>
                    <div className="schedule-time">
                      <Clock size={16} />
                      <span>{item.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="location-info">
            <div className="info-card card">
              <h3>Follow Us for Live Updates</h3>
              <p>Get real-time location updates and special announcements!</p>
              <div className="social-links">
                <a href="#" className="social-link">📱 @FernandosFoodTruck</a>
                <a href="#" className="social-link">📘 Fernando's Mexican Food</a>
                <a href="#" className="social-link">📧 hello@fernandosfoodtruck.com</a>
              </div>
            </div>

            <div className="contact-card card">
              <h3>Book Us for Events</h3>
              <p>Perfect for parties, corporate events, and special occasions!</p>
              <div className="contact-info">
                <div className="contact-item">
                  <span>📞 (555) 123-TACO</span>
                </div>
                <div className="contact-item">
                  <span>📧 events@fernandosfoodtruck.com</span>
                </div>
              </div>
              <button className="btn btn-primary">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Location 