import React from 'react'
import './Footer.css'

// Material-UI Icons
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SendIcon from '@mui/icons-material/Send';

function Footer() {
  return (
    <div className='footer'>
      {/* Floating Bubbles Background */}
      <div className="floating-bubbles">
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
        <div className="bubble"></div>
      </div>

      <div className="footer-main">
        <div className='footer-container'>
          <div className='footer-sections'>
            
            {/* 📍 Contact Section */}
            <div className="footer-section contact-section">
              <h3 className="section-title">Visit Us</h3>
              <div className="contact-content">
                <div className="address-card">
                  <div className="icon-wrapper">
                    <LocationOnIcon className="contact-icon" />
                  </div>
                  <div className="address-details">
                    <p className="organization">Vadodara Central Library</p>
                    <p>Sayajigunj, Vadodara - 390005</p>
                    <p>Near Kirti Mandir, Cultural Square</p>
                    <p>Gujarat, India</p>
                  </div>
                </div>
                
                <div className="contact-methods">
                  <div className="contact-method">
                    <div className="icon-wrapper">
                      <PhoneIcon className="contact-icon" />
                    </div>
                    <span className="contact-text">+91-265-242-2001</span>
                  </div>
                  <div className="contact-method">
                    <div className="icon-wrapper">
                      <EmailIcon className="contact-icon" />
                    </div>
                    <span className="contact-text">info@vadodaralibrary.gov.in</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 🔗 Useful Links */}
            <div className='footer-section links-section'>
              <h3 className="section-title">Quick Links</h3>
              <div className="links-list">
                <a href='/books' className="footer-link">Book Catalog</a>
                <a href='/events' className="footer-link">Events & Programs</a>
                <a href='/digital' className="footer-link">Digital Library</a>
                <a href='/membership' className="footer-link">Membership</a>
                <a href='/research' className="footer-link">Research Help</a>
                <a href='/visit' className="footer-link">Plan Your Visit</a>
              </div>
            </div>

            {/* 🕓 Opening Hours */}
            <div className='footer-section hours-section'>
              <h3 className="section-title">Opening Hours</h3>
              <div className="hours-list">
                <div className="hour-item">
                  <div className="hour-icon">
                    <AccessTimeIcon />
                  </div>
                  <div className="hour-details">
                    <span className="day">Monday - Friday</span>
                    <span className="time">9:00 AM - 8:00 PM</span>
                  </div>
                </div>
                <div className="hour-item">
                  <div className="hour-icon">
                    <AccessTimeIcon />
                  </div>
                  <div className="hour-details">
                    <span className="day">Saturday</span>
                    <span className="time">9:00 AM - 6:00 PM</span>
                  </div>
                </div>
                <div className="hour-item">
                  <div className="hour-icon">
                    <AccessTimeIcon />
                  </div>
                  <div className="hour-details">
                    <span className="day">Sunday</span>
                    <span className="time">10:00 AM - 5:00 PM</span>
                  </div>
                </div>
                <div className="hour-item holiday">
                  <div className="hour-icon">
                    <AccessTimeIcon />
                  </div>
                  <div className="hour-details">
                    <span className="day">Public Holidays</span>
                    <span className="time">Closed</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 📰 Newsletter */}
            <div className='footer-section newsletter-section'>
              <h3 className="section-title">Stay Updated</h3>
              <p className="newsletter-desc">Subscribe to our newsletter for latest updates and events</p>
              <div className="newsletter-form">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="newsletter-input"
                  aria-label="Email for newsletter"
                />
                <button className="subscribe-btn">
                  <SendIcon className="send-icon" />
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* 🌐 Social Links */}
          <div className="social-section">
            <div className="social-links">
              <a 
                href='https://twitter.com/vadodara_lib' 
                className="social-link twitter" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <TwitterIcon />
              </a>
              <a 
                href='https://facebook.com/vadodaralibrary' 
                className="social-link facebook" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FacebookIcon />
              </a>
              <a 
                href='https://linkedin.com/company/vadodara-library' 
                className="social-link linkedin" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <LinkedInIcon />
              </a>
              <a 
                href='https://instagram.com/vadodara_central_library' 
                className="social-link instagram" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 🔒 Copyright */}
      <div className='copyright-section'>
        <div className="copyright-content">
          <p className="copyright-text">© 2025 Vadodara Central Library. All rights reserved.</p>
          <p className="department-text">Department of Libraries, Government of Gujarat</p>
          <p className="design-text">Designed with <span className="heart">❤️</span> for the people of Vadodara</p>
        </div>
      </div>
    </div>
  )
}

export default Footer