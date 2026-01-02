import React from "react";
import { Link } from "react-router-dom";
import "./WelcomeBox.css";

function WelcomeBox() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <header className="welcome-header">
          <div className="hero-badge">
            EST. 1952
          </div>
          
          <h1 className="hero-title">
            Vadodara Central Library
          </h1>
          
          <p className="hero-subtitle">
            A modern digital gateway to centuries of knowledge. Explore our vast collection of books, digital resources, and innovative learning spaces.
          </p>
        </header>

        <section className="actions-section">
          <div className="hero-actions">
            <Link to="/books" className="hero-btn primary">
              Explore Collection
            </Link>
            
            <Link to="/events" className="hero-btn secondary">
              Join Events
            </Link>
          </div>
        </section>

        <section className="metrics-section">
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-number">100K+</div>
              <div className="hero-stat-label">Books</div>
            </div>
            
            <div className="hero-stat">
              <div className="hero-stat-number">10K+</div>
              <div className="hero-stat-label">Members</div>
            </div>
            
            <div className="hero-stat">
              <div className="hero-stat-number">65+</div>
              <div className="hero-stat-label">Years</div>
            </div>
            
            <div className="hero-stat">
              <div className="hero-stat-number">24/7</div>
              <div className="hero-stat-label">Digital Access</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default WelcomeBox;