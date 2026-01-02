import React, { useState, useEffect } from 'react'
import './PopularBooks.css'
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FavoriteIcon from '@mui/icons-material/Favorite';

function PopularBooks() {
    const [hoveredBook, setHoveredBook] = useState(null);
    const [isPaused, setIsPaused] = useState(false);

    const popularBooks = [
        {
            id: 1,
            title: "Wings of Fire",
            author: "A.P.J. Abdul Kalam",
            cover: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.8,
            isPopular: true,
            category: "Biography"
        },
        {
            id: 2,
            title: "The Subtle Art of Not Giving a F*ck",
            author: "Mark Manson",
            cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.5,
            isPopular: true,
            category: "Self-Help"
        },
        {
            id: 3,
            title: "Atomic Habits",
            author: "James Clear",
            cover: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.7,
            isPopular: true,
            category: "Productivity"
        },
        {
            id: 4,
            title: "Ikigai",
            author: "Héctor García",
            cover: "https://images.unsplash.com/photo-1551029506-0807df4e2031?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.6,
            isPopular: true,
            category: "Philosophy"
        },
        {
            id: 5,
            title: "The Psychology of Money",
            author: "Morgan Housel",
            cover: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.4,
            isPopular: false,
            category: "Finance"
        },
        {
            id: 6,
            title: "Rich Dad Poor Dad",
            author: "Robert Kiyosaki",
            cover: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.3,
            isPopular: true,
            category: "Finance"
        },
        {
            id: 7,
            title: "The Alchemist",
            author: "Paulo Coelho",
            cover: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.5,
            isPopular: false,
            category: "Fiction"
        },
        {
            id: 8,
            title: "Thinking Fast and Slow",
            author: "Daniel Kahneman",
            cover: "https://images.unsplash.com/photo-1551029506-0807df4e2031?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
            rating: 4.6,
            isPopular: true,
            category: "Psychology"
        }
    ];

    // Create duplicated array for seamless scrolling
    const duplicatedBooks = [...popularBooks, ...popularBooks, ...popularBooks];

    return (
        <div className='popularbooks-container'>
            {/* Animated Background */}
            <div className="books-bg-animation">
                <div className="floating-book book-1"></div>
                <div className="floating-book book-2"></div>
                <div className="floating-book book-3"></div>
                <div className="floating-book book-4"></div>
                <div className="book-particles"></div>
            </div>

            <div className="books-content">
                {/* Header Section */}
                <div className="books-header">
                    <div className="header-icon">
                        <TrendingUpIcon className="main-icon" />
                    </div>
                    <h2 className='popularbooks-title'>Most Popular Books</h2>
                    <p className="books-subtitle">Discover our most loved and frequently borrowed titles</p>
                    <div className="books-stats">
                        <div className="stat">
                            <span className="stat-number">{popularBooks.length}</span>
                            <span className="stat-label">Featured Books</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">{popularBooks.filter(book => book.isPopular).length}</span>
                            <span className="stat-label">Bestsellers</span>
                        </div>
                        <div className="stat">
                            <span className="stat-number">4.6</span>
                            <span className="stat-label">Avg Rating</span>
                        </div>
                    </div>
                </div>

                {/* Books Marquee */}
                <div 
                    className='popularbooks-wrapper'
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <div className={`popularbooks-track ${isPaused ? 'paused' : ''}`}>
                        {duplicatedBooks.map((book, index) => (
                            <div 
                                key={`${book.id}-${index}`}
                                className={`book-card ${hoveredBook === book.id ? 'hovered' : ''} ${book.isPopular ? 'popular' : ''}`}
                                onMouseEnter={() => setHoveredBook(book.id)}
                                onMouseLeave={() => setHoveredBook(null)}
                            >
                                <div className="book-glow"></div>
                                <div className="book-image-container">
                                    <img 
                                        className='book-cover' 
                                        src={book.cover} 
                                        alt={book.title}
                                    />
                                    <div className="book-overlay"></div>
                                    {book.isPopular && (
                                        <div className="popular-badge">
                                            <FavoriteIcon className="badge-icon" />
                                            Trending
                                        </div>
                                    )}
                                    <div className="book-category">{book.category}</div>
                                </div>
                                <div className="book-info">
                                    <h3 className="book-title">{book.title}</h3>
                                    <p className="book-author">By {book.author}</p>
                                    <div className="book-rating">
                                        <div className="stars">
                                            {[...Array(5)].map((_, i) => (
                                                <StarIcon 
                                                    key={i}
                                                    className={`star ${i < Math.floor(book.rating) ? 'filled' : ''}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="rating-value">{book.rating}</span>
                                    </div>
                                    <button className="borrow-btn">
                                        <AutoStoriesIcon className="btn-icon" />
                                        Borrow Now
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <div className="books-cta">
                    <div className="cta-content">
                        <AutoStoriesIcon className="cta-icon" />
                        <h3>Explore Our Full Collection</h3>
                        <p>Discover thousands of books across all genres in our digital and physical library</p>
                        <button className="view-all-btn glow-effect">
                            <span>View All Books</span>
                            <ArrowForwardIcon className="btn-arrow" />
                            <div className="btn-shine"></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PopularBooks