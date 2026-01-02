import React, { useState, useEffect } from 'react'
import './ImageSlider.css'
import { Carousel } from 'react-bootstrap'
import StarIcon from '@mui/icons-material/Star';
import WifiIcon from '@mui/icons-material/Wifi';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ComputerIcon from '@mui/icons-material/Computer';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function ImageSlider() {
    const [activeIndex, setActiveIndex] = useState(0)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const slides = [
        {
            image: "https://images.unsplash.com/photo-1589998059171-988d887df646?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
            badge: "Premium",
            title: "Grand Reading Hall",
            description: "Spacious and serene environment for focused reading with natural lighting",
            features: [
                { icon: <StarIcon />, text: "Silent Zones" },
                { icon: <WifiIcon />, text: "High-Speed WiFi" },
                { icon: <AutoStoriesIcon />, text: "AC Environment" }
            ]
        },
        {
            image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
            badge: "Collection",
            title: "100,000+ Books Collection",
            description: "From rare manuscripts to contemporary bestsellers across all genres",
            features: [
                { icon: <AutoStoriesIcon />, text: "Rare Books" },
                { icon: <StarIcon />, text: "International" },
                { icon: <AutoStoriesIcon />, text: "Multilingual" }
            ]
        },
        {
            image: "https://images.unsplash.com/photo-1568667256549-094345857637?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
            badge: "Digital",
            title: "Digital Learning Center",
            description: "Access e-books, online resources and digital archives",
            features: [
                { icon: <ComputerIcon />, text: "E-Library" },
                { icon: <WifiIcon />, text: "Online Resources" },
                { icon: <ComputerIcon />, text: "Research Tools" }
            ]
        },
        {
            image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
            badge: "Kids",
            title: "Children's Wonderland",
            description: "Colorful and engaging space for young readers to explore",
            features: [
                { icon: <ChildCareIcon />, text: "Story Time" },
                { icon: <StarIcon />, text: "Educational Toys" },
                { icon: <ChildCareIcon />, text: "Safe Environment" }
            ]
        }
    ]

    return (
        <div className='slider-container'>
            {/* Enhanced Background Animations */}
            <div className="slider-bg">
                <div className="bg-gradient"></div>
                <div className="floating-bubbles">
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                </div>
                <div className="particles-container">
                    {[...Array(20)].map((_, i) => (
                        <div 
                            key={i}
                            className="particle"
                            style={{
                                '--duration': `${15 + i * 2}s`,
                                '--delay': `${i * 0.3}s`,
                                left: `${Math.random() * 100}%`,
                                width: `${2 + Math.random() * 3}px`,
                                height: `${2 + Math.random() * 3}px`
                            }}
                        ></div>
                    ))}
                </div>
                <div 
                    className="cursor-glow"
                    style={{
                        left: `${mousePosition.x}px`,
                        top: `${mousePosition.y}px`
                    }}
                ></div>
            </div>

            {/* Slide Counter */}
            <div className="slide-counter">
                <span className="current-slide">{activeIndex + 1}</span>
                <span className="counter-divider">/</span>
                <span className="total-slides">{slides.length}</span>
            </div>

            <div className='slider-wrapper'>
                <Carousel 
                    fade 
                    interval={5000}
                    onSelect={(index) => setActiveIndex(index)}
                    indicators={false}
                    prevIcon={
                        <span className="carousel-control custom-prev">
                            <ArrowForwardIcon className="control-icon" />
                        </span>
                    }
                    nextIcon={
                        <span className="carousel-control custom-next">
                            <ArrowForwardIcon className="control-icon" />
                        </span>
                    }
                >
                    {slides.map((slide, index) => (
                        <Carousel.Item key={index}>
                            <div className="slide-content">
                                <img
                                    className="slide-image"
                                    src={slide.image}
                                    alt={slide.title}
                                />
                                <div className="image-overlay"></div>
                                <div className="slide-glow"></div>
                                
                                <Carousel.Caption>
                                    <div className="caption-content">
                                        <div className="caption-badge">
                                            <StarIcon className="badge-icon" />
                                            {slide.badge}
                                        </div>
                                        
                                        <h3 className="caption-title">
                                            <span className="title-main">{slide.title}</span>
                                            <span className="title-underline"></span>
                                        </h3>
                                        
                                        <p className="caption-description">{slide.description}</p>
                                        
                                        <div className="caption-features">
                                            {slide.features.map((feature, featureIndex) => (
                                                <div key={featureIndex} className="feature-tag">
                                                    <span className="feature-icon">{feature.icon}</span>
                                                    <span className="feature-text">{feature.text}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <button className="explore-btn">
                                            <span>Explore Facility</span>
                                            <ArrowForwardIcon className="btn-arrow" />
                                            <div className="btn-shine"></div>
                                        </button>
                                    </div>
                                </Carousel.Caption>
                            </div>
                        </Carousel.Item>
                    ))}
                </Carousel>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="slider-progress">
                <div className="progress-track">
                    {slides.map((_, index) => (
                        <div 
                            key={index}
                            className={`progress-item ${index === activeIndex ? 'active' : ''}`}
                            onClick={() => setActiveIndex(index)}
                        >
                            <div className="progress-fill"></div>
                            <div className="progress-glow"></div>
                            <span className="progress-label">{index + 1}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ImageSlider