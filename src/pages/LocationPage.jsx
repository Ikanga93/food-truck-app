import React from 'react'
import { ArrowLeft, MapPin, Navigation, Clock, Phone, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import ApiService from '../services/ApiService'
import './LocationPage.css'

const LocationPage = () => {
  const weeklySchedule = [
    {
      day: 'Monday',
      location: 'Downtown Food District',
      address: '123 Main Street, Downtown',
      time: '11:00 AM - 9:00 PM',
      coordinates: { lat: 40.7128, lng: -74.0060 }, // Example coordinates (NYC)
      isToday: false
    },
    {
      day: 'Tuesday',
      location: 'University Campus',
      address: '456 College Ave, Campus',
      time: '11:00 AM - 8:00 PM',
      coordinates: { lat: 40.7589, lng: -73.9851 },
      isToday: false
    },
    {
      day: 'Wednesday',
      location: 'Business District',
      address: '789 Corporate Blvd, Midtown',
      time: '11:00 AM - 9:00 PM',
      coordinates: { lat: 40.7505, lng: -73.9934 },
      isToday: false
    },
    {
      day: 'Thursday',
      location: 'Park Plaza',
      address: '321 Park Avenue, Central',
      time: '11:00 AM - 9:00 PM',
      coordinates: { lat: 40.7614, lng: -73.9776 },
      isToday: false
    },
    {
      day: 'Friday',
      location: 'Shopping Center',
      address: '654 Mall Drive, Westside',
      time: '11:00 AM - 10:00 PM',
      coordinates: { lat: 40.7282, lng: -74.0776 },
      isToday: false
    },
    {
      day: 'Saturday',
      location: 'Farmers Market',
      address: '987 Market Square, Old Town',
      time: '10:00 AM - 10:00 PM',
      coordinates: { lat: 40.7411, lng: -74.0018 },
      isToday: true // Example: Saturday is today
    }
  ]

  const todayLocation = weeklySchedule.find(schedule => schedule.isToday)

  const openInMaps = (coordinates, address) => {
    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    if (isMobile) {
      // For mobile devices, use the universal maps URL that works with both iOS and Android
      const mapsUrl = `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&ll=${coordinates.lat},${coordinates.lng}&z=17`
      window.open(mapsUrl, '_blank')
    } else {
      // For desktop, open Google Maps in a new tab
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
      window.open(mapsUrl, '_blank')
    }
  }

  const getCurrentDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    return days[new Date().getDay()]
  }

  // Update today's location based on actual current day
  const currentDay = getCurrentDayName()
  const actualTodayLocation = weeklySchedule.find(schedule => schedule.day === currentDay)

  // Live locations state (New functionality)
  const [liveLocations, setLiveLocations] = React.useState([])
  const [isLoadingLiveLocations, setIsLoadingLiveLocations] = React.useState(true)

  // Fetch live locations on component mount (New functionality)
  React.useEffect(() => {
    const fetchLiveLocations = async () => {
      try {
        const data = await ApiService.getLiveLocations()
        setLiveLocations(data)
      } catch (error) {
        console.warn('Live locations not available:', error)
        // Set empty array if live locations API fails - this is okay for new feature
        setLiveLocations([])
      } finally {
        setIsLoadingLiveLocations(false)
      }
    }

    fetchLiveLocations()
  }, [])

  return (
    <div className="location-page">
      <div className="location-hero">
        <div className="container">
          <Link to="/" className="back-link">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
          <h1 className="location-page-title">Find Fernando's</h1>
          <p className="location-page-subtitle">
            We bring authentic Mexican flavors to different locations throughout the week
          </p>
        </div>
      </div>

      {/* Live Locations Section (New functionality) */}
      {liveLocations.length > 0 && (
        <div className="live-locations">
          <div className="container">
            <h2 className="live-locations-title">🚚 Food Trucks Right Now!</h2>
            <p className="live-locations-subtitle">
              Our trucks are currently at these locations
            </p>
            
            <div className="live-locations-grid">
              {liveLocations.map((liveLocation) => (
                <div key={liveLocation.id} className="live-location-card">
                  <div className="live-location-header">
                    <div className="live-badge">
                      <span className="live-indicator">●</span>
                      LIVE NOW
                    </div>
                    <h3 className="live-truck-name">{liveLocation.truck_name}</h3>
                  </div>
                  
                  <div className="live-location-content">
                    <div className="live-location-info">
                      <div className="info-item">
                        <MapPin className="info-icon" />
                        <span>{liveLocation.current_address}</span>
                      </div>
                      {liveLocation.hours_today && (
                        <div className="info-item">
                          <Clock className="info-icon" />
                          <span>{liveLocation.hours_today}</span>
                        </div>
                      )}
                      {liveLocation.description && (
                        <div className="info-item">
                          <span className="description">{liveLocation.description}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="live-location-actions">
                      {liveLocation.latitude && liveLocation.longitude ? (
                        <button 
                          className="btn btn-primary gps-btn"
                          onClick={() => openInMaps(
                            { lat: liveLocation.latitude, lng: liveLocation.longitude }, 
                            liveLocation.current_address
                          )}
                        >
                          <Navigation size={20} />
                          Get Directions
                        </button>
                      ) : (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(liveLocation.current_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary gps-btn"
                        >
                          <Navigation size={20} />
                          Find on Maps
                        </a>
                      )}
                      <a href="tel:+12172550210" className="btn btn-secondary">
                        <Phone size={20} />
                        Call Us
                      </a>
                    </div>
                  </div>
                  
                  <div className="live-location-time">
                    Last updated: {new Date(liveLocation.last_updated).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's Location Section */}
      {actualTodayLocation && (
        <div className="todays-location">
          <div className="container">
            <div className="today-card">
              <div className="today-header">
                <div className="today-badge">
                  <Calendar size={16} />
                  Today - {actualTodayLocation.day}
                </div>
                <h2 className="today-title">We're at {actualTodayLocation.location}</h2>
              </div>
              
              <div className="today-content">
                <div className="today-info">
                  <div className="info-item">
                    <MapPin className="info-icon" />
                    <span>{actualTodayLocation.address}</span>
                  </div>
                  <div className="info-item">
                    <Clock className="info-icon" />
                    <span>{actualTodayLocation.time}</span>
                  </div>
                  <div className="info-item">
                    <Phone className="info-icon" />
                    <span>(217) 255-0210</span>
                  </div>
                </div>
                
                <div className="today-actions">
                  <button 
                    className="btn btn-primary gps-btn"
                    onClick={() => openInMaps(actualTodayLocation.coordinates, actualTodayLocation.address)}
                  >
                    <Navigation size={20} />
                    Get Directions
                  </button>
                  <a href="tel:+12172550210" className="btn btn-secondary">
                    <Phone size={20} />
                    Call Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="weekly-schedule">
        <div className="container">
          <h2 className="schedule-title">Weekly Schedule</h2>
          <p className="schedule-subtitle">
            Find us at these locations throughout the week
          </p>
          
          <div className="schedule-grid">
            {weeklySchedule.map((schedule, index) => (
              <div 
                key={index} 
                className={`schedule-card ${schedule.day === currentDay ? 'today' : ''}`}
              >
                <div className="schedule-header">
                  <h3 className="schedule-day">{schedule.day}</h3>
                  {schedule.day === currentDay && (
                    <span className="today-indicator">Today</span>
                  )}
                </div>
                
                <div className="schedule-content">
                  <h4 className="schedule-location">{schedule.location}</h4>
                  <div className="schedule-details">
                    <div className="detail-item">
                      <MapPin size={16} />
                      <span>{schedule.address}</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>{schedule.time}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="directions-btn"
                    onClick={() => openInMaps(schedule.coordinates, schedule.address)}
                  >
                    <Navigation size={16} />
                    Directions
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="schedule-note">
            <div className="note-content">
              <h3>📍 Can't find us?</h3>
              <p>
                Our schedule may change due to weather or special events. 
                Follow us on social media or call us for real-time updates!
              </p>
              <div className="contact-info">
                <a href="tel:+12172550210" className="contact-link">
                  <Phone size={16} />
                  (217) 255-0210
                </a>
                <a href="https://www.facebook.com/FernandosTacosAndMore/" target="_blank" rel="noopener noreferrer" className="contact-link">
                  📱 @FernandosTacosAndMore
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationPage 