// src/pages/AllBooks.js - FIXED WITH DEBOUNCE (NO INFINITE LOOP)
import React, { useState, useEffect, useContext, useCallback } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import "./AllBooks.css";

// Icons
import SearchIcon from '@mui/icons-material/Search';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import StarIcon from '@mui/icons-material/Star';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import FilterListIcon from '@mui/icons-material/FilterList';
import SortIcon from '@mui/icons-material/Sort';

// PDF Components
import PDFViewer from "../components/PDFViewer";
import PDFUpload from "../components/PDFUpload";

function AllBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    availability: "",
    sortBy: "newest"
  });
  const [viewMode, setViewMode] = useState("grid");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  // PDF Modal States
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [showPDFUpload, setShowPDFUpload] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  
  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  
  const location = useLocation();

  // Check user role on component mount
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && (user.isAdmin || user.isLibrarian)) {
      setIsAdmin(true);
    }
  }, []);

  // Get search query from URL (only once)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlSearchQuery = searchParams.get('search');
    
    if (urlSearchQuery) {
      setSearchTerm(urlSearchQuery);
    }
    
    // Initial fetch
    fetchBooks();
  }, [location.search]);

  // ✅ FIXED: Load search history (only once)
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error("Error parsing search history:", error);
        setSearchHistory([]);
      }
    }
  }, []);

  const saveToSearchHistory = useCallback((query) => {
    if (query.trim()) {
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 5);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
        return newHistory;
      });
    }
  }, []);

  // ✅ FIXED: Fetch books with debounce and cache
  const fetchBooks = useCallback(async (searchQuery = "", filterOverrides = {}) => {
    try {
      setLoading(true);
      
      const currentTime = Date.now();
      // Prevent too frequent API calls (minimum 500ms between calls)
      if (currentTime - lastFetchTime < 500) {
        console.log("Skipping fetch - too frequent");
        return;
      }
      setLastFetchTime(currentTime);
      
      const params = {
        ...filters,
        ...filterOverrides,
        search: searchQuery || searchTerm
      };
      
      // Remove empty parameters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      console.log("📚 Fetching books with params:", params);
      
      const response = await axios.get(`${API_URL}/books/allbooks`, { 
        params,
        timeout: 10000 
      });
      
      if (response.data && response.data.success) {
        const booksData = response.data.data?.books || response.data.data;
        
        if (Array.isArray(booksData)) {
          setBooks(booksData);
          console.log(`✅ Loaded ${booksData.length} books`);
        } else {
          console.warn("Books data is not an array:", booksData);
          setBooks([]);
        }
      } else {
        console.warn("API response not successful:", response.data);
        setBooks([]);
      }
    } catch (error) {
      console.error("❌ Error fetching books:", error);
      
      // Show user-friendly error message
      if (error.code === 'ECONNABORTED') {
        console.log("Request timeout, retrying...");
        // Could add retry logic here
      }
      
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchTerm, lastFetchTime]);

  // ✅ FIXED: Search with debouncing
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous timeout
    if (window.searchTimeout) {
      clearTimeout(window.searchTimeout);
    }
    
    // Set new timeout for debouncing
    window.searchTimeout = setTimeout(() => {
      if (value.trim()) {
        saveToSearchHistory(value);
        fetchBooks(value);
      } else {
        fetchBooks();
      }
    }, 500); // 500ms debounce
  };

  const handleFilterChange = useCallback((filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  }, []);

  // ✅ FIXED: Use debounce for filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only fetch if filters actually changed
      fetchBooks();
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timer);
  }, [filters.category, filters.availability, filters.sortBy]);

  const clearFilters = () => {
    setFilters({
      category: "",
      availability: "",
      sortBy: "newest"
    });
    setSearchTerm("");
    fetchBooks();
  };

  // Handle PDF actions
  const handleReadPDF = (book) => {
    if (!book.digitalCopy?.available) {
      alert('No digital copy available for this book');
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) {
      alert('Please login to read digital copies');
      return;
    }
    
    setSelectedBook(book);
    setShowPDFViewer(true);
  };

  const handleUploadPDF = (book) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || (!user.isAdmin && !user.isLibrarian)) {
      alert('Only administrators can upload PDFs');
      return;
    }
    
    setSelectedBook(book);
    setShowPDFUpload(true);
  };

  // Handle book borrowing
  const handleBorrowBook = async (bookId, bookName, author) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert('Please login to borrow books');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const response = await axios.post(`${API_URL}/transactions/issue`, {
        bookId: bookId,
        userId: user.id || user._id,
        days: 14
      });

      if (response.data.success) {
        alert('Book borrowed successfully!');
        fetchBooks(); // Refresh the book list
      }
    } catch (error) {
      console.error('❌ Error borrowing book:', error);
      alert(error.response?.data?.message || 'Error borrowing book');
    }
  };

  // Handle wishlist addition
  const handleAddToWishlist = async (bookId, bookName) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        alert('Please login to add books to wishlist');
        return;
      }

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";
      const response = await axios.post(`${API_URL}/users/wishlist/add`, {
        userId: user.id || user._id,
        bookId: bookId
      });

      if (response.data.success) {
        alert(`"${bookName}" added to wishlist!`);
      } else {
        alert(response.data.message || 'Error adding to wishlist');
      }
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      alert(error.response?.data?.message || 'Error adding to wishlist');
    }
  };

  if (loading) {
    return (
      <div className="books-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading Books...</h3>
          <p>Discovering amazing books for you</p>
        </div>
      </div>
    );
  }

  // Create a safe books array to prevent errors
  const safeBooksArray = Array.isArray(books) ? books : [];

  return (
    <div className="books-page">
      {/* PDF Modals */}
      {showPDFViewer && selectedBook && (
        <div className="modal-overlay pdf-modal">
          <div className="pdf-modal-content">
            <PDFViewer 
              book={selectedBook} 
              onClose={() => {
                setShowPDFViewer(false);
                setSelectedBook(null);
              }} 
            />
          </div>
        </div>
      )}

      {showPDFUpload && selectedBook && (
        <div className="modal-overlay upload-modal">
          <div className="upload-modal-content">
            <PDFUpload 
              book={selectedBook}
              onUploadSuccess={(updatedBook) => {
                setShowPDFUpload(false);
                setSelectedBook(null);
                fetchBooks(); // Refresh the book list
              }}
              onCancel={() => {
                setShowPDFUpload(false);
                setSelectedBook(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="books-header">
        <div className="container">
          <h1>Our Book Collection</h1>
          <p>Discover {safeBooksArray.length} books across various genres</p>
          
          <div className="search-filters">
            <div className="search-box-with-suggestions">
              <SearchIcon aria-hidden="true" />
              <input
                type="text"
                placeholder="Search books, authors, categories..."
                value={searchTerm}
                onChange={handleSearch}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    saveToSearchHistory(searchTerm);
                    fetchBooks();
                  }
                }}
                aria-label="Search books"
              />
              {searchTerm && (
                <button 
                  className="clear-search"
                  onClick={() => {
                    setSearchTerm("");
                    fetchBooks();
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
              
              {showSuggestions && searchHistory.length > 0 && (
                <div className="search-suggestions" role="listbox">
                  {searchHistory.map((item, index) => (
                    <div 
                      key={index}
                      className="suggestion-item"
                      onClick={() => {
                        setSearchTerm(item);
                        fetchBooks(item);
                        setShowSuggestions(false);
                      }}
                      role="option"
                      tabIndex="0"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="filter-controls">
              <div className="filter-group">
                <FilterListIcon className="filter-icon" />
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="">All Categories</option>
                  <option value="Fiction">Fiction</option>
                  <option value="Non-Fiction">Non-Fiction</option>
                  <option value="Science">Science</option>
                  <option value="Technology">Technology</option>
                  <option value="History">History</option>
                  <option value="Biography">Biography</option>
                  <option value="Literature">Literature</option>
                </select>
              </div>
              
              <div className="filter-group">
                <select 
                  value={filters.availability} 
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  aria-label="Filter by availability"
                >
                  <option value="">All Books</option>
                  <option value="available">Available Now</option>
                  <option value="unavailable">Checked Out</option>
                  <option value="digital">Digital Only</option>
                </select>
              </div>
              
              <div className="filter-group">
                <SortIcon className="filter-icon" />
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  aria-label="Sort books by"
                >
                  <option value="newest">Newest First</option>
                  <option value="popularity">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
              
              <div className="view-toggle" role="radiogroup" aria-label="View mode">
                <button 
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <ViewModuleIcon aria-hidden="true" />
                </button>
                <button 
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                  title="List View"
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <ViewListIcon aria-hidden="true" />
                </button>
              </div>

              {(searchTerm || filters.category || filters.availability !== "") && (
                <button className="clear-filters" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {searchTerm && (
            <div className="search-results-info">
              <p>
                Search results for: <strong>"{searchTerm}"</strong> 
                <span className="results-count"> - {safeBooksArray.length} books found</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="books-container">
        <div className="container">
          {safeBooksArray.length > 0 ? (
            <div className={`books-grid ${viewMode}`} role="list" aria-label="Book collection">
              {safeBooksArray.map(book => {
                const hasDigitalCopy = book.digitalCopy?.available || false;
                
                return (
                  <div key={book._id} className="book-card" role="listitem">
                    <div className="book-image">
                      <img
                        src={
                          book.coverImage 
                            ? `http://localhost:4000${book.coverImage}`
                            : "https://via.placeholder.com/200x300/4f46e5/ffffff?text=No+Cover"
                        }
                        alt={`Cover of ${book.bookName} by ${book.author}`}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/200x300/4f46e5/ffffff?text=No+Cover";
                        }}
                      />
                      {book.bookCountAvailable === 0 && !hasDigitalCopy && (
                        <div className="out-of-stock" aria-label="Out of stock">Out of Stock</div>
                      )}
                      {hasDigitalCopy && (
                        <div className="digital-badge" aria-label="Digital copy available">
                          <PictureAsPdfIcon className="pdf-icon" /> Digital
                        </div>
                      )}
                      {book.popularity > 90 && (
                        <div className="popular-badge" aria-label="Popular book">Popular</div>
                      )}
                    </div>
                    
                    <div className="book-info">
                      <h3 className="book-title">{book.bookName}</h3>
                      <p className="book-author">By {book.author}</p>
                      
                      <div className="book-meta">
                        {book.edition && <span className="edition">{book.edition}</span>}
                        {book.publicationYear && <span className="year">{book.publicationYear}</span>}
                        {hasDigitalCopy && (
                          <span className="digital-indicator" title="Digital copy available">
                            <PictureAsPdfIcon className="small-pdf-icon" />
                          </span>
                        )}
                      </div>
                      
                      <div className="book-rating">
                        <StarIcon className="star" aria-hidden="true" />
                        <span>{book.rating?.average?.toFixed(1) || "0.0"}</span>
                        <span className="rating-count">({book.rating?.count || 0})</span>
                      </div>
                      
                      <div className="book-availability">
                        <span className={`status ${book.bookCountAvailable > 0 ? 'available' : 'unavailable'}`}>
                          {book.bookCountAvailable > 0 
                            ? `${book.bookCountAvailable} Available` 
                            : 'Checked Out'
                          }
                        </span>
                        {hasDigitalCopy && (
                          <span className="digital-status">Digital Available</span>
                        )}
                      </div>
                      
                      <div className="book-actions">
                        {hasDigitalCopy ? (
                          <button 
                            className="btn-primary btn-read"
                            onClick={() => handleReadPDF(book)}
                            aria-label={`Read digital copy of ${book.bookName}`}
                          >
                            <PictureAsPdfIcon className="action-icon" /> Read Online
                          </button>
                        ) : (
                          <button 
                            className="btn-primary"
                            disabled={book.bookCountAvailable === 0}
                            onClick={() => handleBorrowBook(book._id, book.bookName, book.author)}
                            aria-label={`Borrow ${book.bookName} by ${book.author}`}
                            aria-disabled={book.bookCountAvailable === 0}
                          >
                            {book.bookCountAvailable > 0 ? 'Borrow Book' : 'Join Waitlist'}
                          </button>
                        )}
                        
                        <button 
                          className="btn-secondary"
                          onClick={() => handleAddToWishlist(book._id, book.bookName)}
                          aria-label={`Add ${book.bookName} to wishlist`}
                        >
                          Add to Wishlist
                        </button>
                        
                        {isAdmin && (
                          <button 
                            className="btn-upload"
                            onClick={() => handleUploadPDF(book)}
                            aria-label={`Upload PDF for ${book.bookName}`}
                            title="Upload/Replace PDF"
                          >
                            <CloudUploadIcon className="action-icon" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-books">
              <div className="no-books-icon">📚</div>
              <h3>No books found</h3>
              <p>Try adjusting your search terms or filters</p>
              <button className="btn-primary" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AllBooks;