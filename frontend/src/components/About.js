import React from "react";
import "./About.css";

function About() {
  return (
    <div className="about-page">
      {/* 🌟 ENHANCED BACKGROUND */}
      <div className="about-bg">
        <div className="floating-bubbles">
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
          <div className="bubble"></div>
        </div>
      </div>

      <div className="about-container">
        {/* 🌟 HEADER */}
        <div className="about-header">
          <h1 className="about-title">Vadodara Central Library</h1>
          <div className="title-underline"></div>
        </div>

        {/* 📊 MAIN CONTENT */}
        <div className="about-content">
          {/* LEFT COLUMN - VISUAL */}
          <div className="about-left">
            <div className="visual-card">
              <img
                src="https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                alt="Vadodara Library Interior"
                className="visual-image"
              />
              <div className="visual-overlay">
                <span className="visual-badge">Since 1952</span>
                <h3>Our Heritage Building</h3>
                <p>Cultural landmark serving the community for over 65 years</p>
              </div>
            </div>

            {/* 📈 STATS */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">100K+</div>
                <div className="stat-label">Books</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">10K+</div>
                <div className="stat-label">Members</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">50+</div>
                <div className="stat-label">Events</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">65+</div>
                <div className="stat-label">Years</div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - CONTENT */}
          <div className="about-right">
            {/* Legacy Section */}
            <div className="about-section">
              <div className="section-header">
                <div className="section-icon">📚</div>
                <h3 className="section-title">Our Legacy</h3>
              </div>
              <p className="section-content">
                Welcome to <strong>Vadodara Central Library</strong> — a cornerstone of education and culture in Gujarat since 1952. 
                We serve students, researchers, and knowledge seekers with traditional wisdom and modern innovation.
              </p>
            </div>

            {/* Collections Section */}
            <div className="about-section">
              <div className="section-header">
                <div className="section-icon">🌟</div>
                <h3 className="section-title">Collections & Resources</h3>
              </div>
              <p className="section-content">
                From rare Gujarati manuscripts to contemporary research papers, our collection celebrates both heritage and modern knowledge. 
                We house over <strong>100,000 books</strong> across diverse disciplines.
              </p>
            </div>

            {/* Mission Section */}
            <div className="about-section">
              <div className="section-header">
                <div className="section-icon">🎯</div>
                <h3 className="section-title">Our Mission</h3>
              </div>
              <p className="section-content">
                To empower every visitor with accessible knowledge, foster lifelong learning, and build an informed community 
                through our extensive resources and innovative services.
              </p>
            </div>

            {/* 💫 QUOTE */}
            <div className="quote-card">
              <blockquote className="quote-text">
                "A library is not a luxury but one of the necessities of life. It remains the brightest star guiding us through darkness."
              </blockquote>
              <p className="quote-author">— Henry Ward Beecher</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;