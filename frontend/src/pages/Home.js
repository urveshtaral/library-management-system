// src/pages/Home.js
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

// Import all components
import Header from '../components/Header';
import Footer from '../components/Footer';
import WelcomeBox from '../components/WelcomeBox';
import ImageSlider from '../components/ImageSlider';
import QuickActions from '../components/QuickActions';
import LibraryInfo from '../components/LibraryInfo';
import Stats from '../components/Stats';
import PopularBooks from '../components/PopularBooks';
import RecentAddedBooks from '../components/RecentAddedBooks';
import ReservedBooks from '../components/ReservedBooks';
import News from '../components/News';
import PhotoGallery from '../components/PhotoGallery';
import About from '../components/About';

function Home() {
  const [scrolled, setScrolled] = useState(false);

  const handleScroll = useCallback(() => {
    const isScrolled = window.scrollY > 50;
    setScrolled(isScrolled);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="home-container">
      {/* 1. HEADER - Always visible at top */}
      <Header className={scrolled ? 'scrolled' : ''} />

      {/* 2. WELCOME BOX - Welcome message and introduction */}
      <section className="home-section">
        <WelcomeBox />
      </section>

      {/* 3. IMAGE SLIDER - Hero visual section */}
      <section className="home-section full-width">
        <ImageSlider />
      </section>

      {/* 4. QUICK ACTIONS - Immediate user actions */}
      <section className="home-section">
        <QuickActions />
      </section>

      {/* 5. LIBRARY INFO - Basic introduction */}
      <section className="home-section">
        <LibraryInfo />
      </section>

      {/* 6. STATISTICS - Library metrics */}
      <section className="home-section">
        <Stats />
      </section>

      {/* 7. POPULAR BOOKS - Most borrowed/read books */}
      <section className="home-section">
        <PopularBooks />
      </section>

      {/* 8. RECENTLY ADDED BOOKS - New arrivals */}
      <section className="home-section">
        <RecentAddedBooks />
      </section>

      {/* 9. RESERVED BOOKS - User's reserved items */}
      <section className="home-section">
        <ReservedBooks />
      </section>

      {/* 10. NEWS & EVENTS - Latest updates */}
      <section className="home-section">
        <News />
      </section>

      {/* 11. PHOTO GALLERY - Visual library tour */}
      <section className="home-section">
        <PhotoGallery />
      </section>

      {/* 12. ABOUT - Detailed information */}
      <section className="home-section">
        <About />
      </section>

      {/* 13. FOOTER - Bottom navigation and info */}
      <Footer />

      {/* FLOATING ACTION BUTTONS - Quick access */}
      <div className="floating-cta">
        <Link to="/books" className="cta-button" aria-label="Search Books">
          <span role="img" aria-hidden="true">🔍</span>
          <span>Search Books</span>
        </Link>
        <Link to="/events" className="cta-button" aria-label="View Events">
          <span role="img" aria-hidden="true">📅</span>
          <span>View Events</span>
        </Link>
        <Link to="/profile" className="cta-button" aria-label="Profile">
          <span role="img" aria-hidden="true">👤</span>
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
}

export default Home;