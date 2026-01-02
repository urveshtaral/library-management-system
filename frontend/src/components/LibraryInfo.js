import React from 'react';
import './LibraryInfo.css';

import LocationOnIcon from '@material-ui/icons/LocationOn';
import ScheduleIcon from '@material-ui/icons/Schedule';
import PhoneIcon from '@material-ui/icons/Phone';
import EmailIcon from '@material-ui/icons/Email';
import PublicIcon from '@material-ui/icons/Public';
import GroupIcon from '@material-ui/icons/Group';

function LibraryInfo() {
  const features = [
    {
      icon: <LocationOnIcon />,
      title: "Prime Location",
      description: "Located in the heart of Vadodara, easily accessible from all areas"
    },
    {
      icon: <ScheduleIcon />,
      title: "Flexible Timings",
      description: "Open 7 days a week with extended hours for students"
    },
    {
      icon: <GroupIcon />,
      title: "Expert Staff",
      description: "Qualified librarians and subject matter experts"
    },
    {
      icon: <PublicIcon />,
      title: "Digital Access",
      description: "Online catalog and digital resources available 24/7"
    }
  ];

  return (
    <div className="library-info">
      <div className="container">
        <div className="info-grid">
          <div className="info-content">
            <h2>Vadodara Central Library</h2>
            <p className="info-description">
              Established in 1952, Vadodara Central Library stands as a beacon of knowledge 
              and learning in Gujarat. Spread across 50,000 square feet, we house over 
              100,000 books spanning various genres, languages, and disciplines.
            </p>
            
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <div className="feature-icon">{feature.icon}</div>
                  <div>
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="contact-info">
              <h3>Contact Information</h3>
              <div className="contact-details">
                <div className="contact-item">
                  <LocationOnIcon />
                  <span>Sayajigunj, Vadodara, Gujarat - 390005<br/>
                  Near Kirti Mandir, Cultural Square</span>
                </div>
                <div className="contact-item">
                  <PhoneIcon />
                  <span>+91-265-242-2001<br/>+91-265-242-2002</span>
                </div>
                <div className="contact-item">
                  <EmailIcon />
                  <span>info@vadodaralibrary.gov.in<br/>support@vadodaralibrary.gov.in</span>
                </div>
                <div className="contact-item">
                  <ScheduleIcon />
                  <span>Monday-Saturday: 9:00 AM - 8:00 PM<br/>
                  Sunday: 10:00 AM - 6:00 PM</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="info-map">
            <div className="map-placeholder">
              <h3>Library Location</h3>
              <p>📍 Sayajigunj, Vadodara</p>
              <div className="map-actions">
                <button className="map-btn">Get Directions</button>
                <button className="map-btn">Virtual Tour</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LibraryInfo;