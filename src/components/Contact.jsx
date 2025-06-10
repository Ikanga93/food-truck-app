import React, { useState } from 'react'
import { Phone, Mail, MessageCircle, Send } from 'lucide-react'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission here
    alert('¡Gracias! We\'ll get back to you soon!')
    setFormData({ name: '', email: '', message: '' })
  }

  return (
    <section id="contact" className="contact section">
      <div className="container">
        <h2 className="section-title">Contact Us</h2>
        <p className="section-subtitle">
          Have questions? Want to book us for an event? We'd love to hear from you!
        </p>

        <div className="contact-content">
          <div className="contact-info">
            <div className="contact-item">
              <div className="contact-icon">
                <Phone />
              </div>
              <div className="contact-details">
                <h3>Call Us</h3>
                <p>(555) 123-TACO</p>
                <span>Mon-Sat: 10AM-10PM</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <Mail />
              </div>
              <div className="contact-details">
                <h3>Email Us</h3>
                <p>hello@fernandosfoodtruck.com</p>
                <span>We reply within 24 hours</span>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-icon">
                <MessageCircle />
              </div>
              <div className="contact-details">
                <h3>Follow Us</h3>
                <p>@FernandosFoodTruck</p>
                <span>Daily updates & specials</span>
              </div>
            </div>
          </div>

          <form className="contact-form card" onSubmit={handleSubmit}>
            <h3>Send us a Message</h3>
            
            <div className="form-group">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <textarea
                name="message"
                placeholder="Your Message"
                rows="5"
                value={formData.message}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn btn-primary">
              <Send size={18} />
              Send Message
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

export default Contact 