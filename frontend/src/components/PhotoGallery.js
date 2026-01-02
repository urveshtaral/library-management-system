import React, { useState } from "react";
import "./PhotoGallery.css";
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import CollectionsIcon from '@mui/icons-material/Collections';
import StarIcon from '@mui/icons-material/Star';

function PhotoGallery() {
  const [selectedImage, setSelectedImage] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const images = [
    {
      src: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Grand Reading Hall",
      description: "Our spacious main reading area with natural lighting",
      featured: true
    },
    {
      src: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Book Collection",
      description: "Over 100,000 books across various genres",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1568667256549-094345857637?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Digital Library",
      description: "Modern computer lab with digital resources",
      featured: true
    },
    {
      src: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Children's Section",
      description: "Colorful and engaging space for young readers",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Study Rooms",
      description: "Private study rooms for focused learning",
      featured: true
    },
    {
      src: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Library Exterior",
      description: "Beautiful heritage building of Vadodara Library",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Research Section",
      description: "Dedicated area for academic research",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "New Arrivals",
      description: "Latest books and publications display",
      featured: true
    },
    {
      src: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Library Events",
      description: "Community events and workshops",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Reading Lounge",
      description: "Comfortable seating for casual reading",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1555421689-491a97ff2040?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Magazine Section",
      description: "Latest magazines and periodicals",
      featured: false
    },
    {
      src: "https://images.unsplash.com/photo-1568667256549-094345857637?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      title: "Computer Access",
      description: "Free computer and internet access",
      featured: false
    }
  ];

  const featuredImages = images.filter(img => img.featured);
  const regularImages = images.filter(img => !img.featured);

  return (
    <div className="photogallery-container">
      {/* Animated Background Elements */}
      <div className="gallery-bg-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="pulse-dots"></div>
      </div>

      <div className="gallery-content">
        {/* Header Section */}
        <div className="gallery-header">
          <div className="header-icon">
            <CollectionsIcon className="main-icon" />
          </div>
          <h1 className="photogallery-title">Explore Our Library</h1>
          <p className="gallery-subtitle">
            Take a virtual tour of Vadodara Central Library's state-of-the-art facilities and heritage spaces
          </p>
          <div className="gallery-stats">
            <div className="stat">
              <span className="stat-number">{images.length}</span>
              <span className="stat-label">Spaces</span>
            </div>
            <div className="stat">
              <span className="stat-number">{featuredImages.length}</span>
              <span className="stat-label">Featured</span>
            </div>
            <div className="stat">
              <span className="stat-number">100K+</span>
              <span className="stat-label">Books</span>
            </div>
          </div>
        </div>

        {/* Featured Images Grid */}
        <div className="featured-section">
          <div className="section-header">
            <StarIcon className="section-icon" />
            <h2 className="section-title">Featured Spaces</h2>
          </div>
          <div className="featured-grid">
            {featuredImages.map((image, index) => (
              <div 
                key={index} 
                className={`photo-card featured-card ${hoveredCard === index ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedImage(image)}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="card-badge">
                  <StarIcon className="badge-icon" />
                  Featured
                </div>
                <div className="card-glow"></div>
                <img src={image.src} alt={image.title} className="photo-img" />
                <div className="photo-overlay">
                  <div className="overlay-content">
                    <h3 className="photo-title">{image.title}</h3>
                    <p className="photo-description">{image.description}</p>
                    <button className="view-details-btn">
                      <ZoomInIcon className="btn-icon" />
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Regular Images Grid */}
        <div className="regular-section">
          <div className="section-header">
            <CollectionsIcon className="section-icon" />
            <h2 className="section-title">All Spaces</h2>
          </div>
          <div className="photogallery-grid">
            {regularImages.map((image, index) => (
              <div 
                key={index} 
                className={`photo-card ${hoveredCard === index + featuredImages.length ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCard(index + featuredImages.length)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => setSelectedImage(image)}
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <div className="card-glow"></div>
                <img src={image.src} alt={image.title} className="photo-img" />
                <div className="photo-overlay">
                  <div className="overlay-content">
                    <h3 className="photo-title">{image.title}</h3>
                    <p className="photo-description">{image.description}</p>
                    <button className="view-details-btn">
                      <ZoomInIcon className="btn-icon" />
                      Explore
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="gallery-cta">
          <div className="cta-content">
            <h3>Want to Visit in Person?</h3>
            <p>Plan your visit and experience our library facilities firsthand</p>
            <button className="cta-button glow-effect">
              <span>Plan Your Visit</span>
              <div className="btn-shine"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedImage(null)}>×</button>
            <img src={selectedImage.src} alt={selectedImage.title} />
            <div className="modal-info">
              <h3>{selectedImage.title}</h3>
              <p>{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery;