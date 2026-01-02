// src/components/Header.js - FIXED WITH PROPER ADMIN NAVIGATION
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

import MenuIcon from '@mui/icons-material/Menu';
import ClearIcon from '@mui/icons-material/Clear';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ClearIconSmall from '@mui/icons-material/Clear';

function Header() {
  const [menutoggle, setMenutoggle] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([]);
  const [user, setUser] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load user from localStorage on component mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        setUser(null);
      }
    };
    
    loadUser();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadUser();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // ✅ Sync search query with URL on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlSearchQuery = searchParams.get('search');
    if (urlSearchQuery) {
      setSearchQuery(decodeURIComponent(urlSearchQuery));
    }
  }, [location.search]);

  // Load search history and popular searches
  useEffect(() => {
    loadSearchHistory();
    loadPopularSearches();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 30;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadSearchHistory = () => {
    try {
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      setSearchHistory(history);
    } catch (error) {
      console.error('Error loading search history:', error);
      setSearchHistory([]);
    }
  };

  const loadPopularSearches = () => {
    // Mock popular searches
    const mockPopular = [
      { term: 'Harry Potter', count: 45 },
      { term: 'Computer Science', count: 32 },
      { term: 'Indian History', count: 28 },
      { term: 'Javascript Programming', count: 24 },
      { term: 'Biographies', count: 19 }
    ];
    setPopularSearches(mockPopular);
  };

  const Toggle = () => setMenutoggle(!menutoggle);
  const closeMenu = () => setMenutoggle(false);
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/');
    closeMenu();
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value.trim()) {
      setShowSuggestions(true);
    }
  };

  // ENHANCED Search functionality with URL sync
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const newSearchTerm = searchQuery.trim();
      const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const filteredHistory = history.filter(item => item.toLowerCase() !== newSearchTerm.toLowerCase());
      const newHistory = [newSearchTerm, ...filteredHistory].slice(0, 10);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      
      setSearchHistory(newHistory);
      navigate(`/books?search=${encodeURIComponent(newSearchTerm)}`);
      setShowSuggestions(false);
      closeMenu();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (term) => {
    setSearchQuery(term);
    navigate(`/books?search=${encodeURIComponent(term)}`);
    setShowSuggestions(false);
    closeMenu();
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('searchHistory');
    setSearchHistory([]);
  };

  const clearSingleSearch = (term, e) => {
    e.stopPropagation();
    const filteredHistory = searchHistory.filter(item => item !== term);
    localStorage.setItem('searchHistory', JSON.stringify(filteredHistory));
    setSearchHistory(filteredHistory);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    if (location.pathname.includes('/books')) {
      navigate('/books');
    }
  };

  const handleHomeClick = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    closeMenu();
  };

  // Handle Admin Login - Navigate to admin login page
  const handleAdminLogin = () => {
    // Clear any existing user data to force fresh login
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    navigate('/admin-login');
    closeMenu();
  };

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''}`} role="banner">
      {/* Left - Logo */}
      <div className="logo-nav">
        <Link to="/" className="logo" onClick={handleHomeClick} aria-label="Vadodara Central Library Home">
          <div className="logo-morph">
            <div className="logo-icon-wrapper">
              <LocalLibraryIcon className="logo-icon" aria-hidden="true" />
            </div>
          </div>
          <div className="logo-text-container">
            <span className="logo-text">Vadodara Central Library</span>
            <span className="logo-subtext">Since 1950 • Knowledge Hub</span>
          </div>
        </Link>
      </div>

      {/* Center - Search bar with suggestions */}
      <div className="search-container" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="search-form" role="search">
          <div className={`search-bar ${searchFocused ? 'focused' : ''}`}>
            <SearchIcon className="search-icon" aria-hidden="true" />
            <input
              className="search-input"
              type="text"
              placeholder="Search books, authors, categories..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyPress={handleKeyPress}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              aria-label="Search library books"
              aria-describedby="search-suggestions"
            />
            {searchQuery && (
              <button 
                type="button"
                className="clear-search-btn"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <ClearIconSmall style={{ fontSize: 16 }} />
              </button>
            )}
            <button 
              type="submit" 
              className="search-submit"
              aria-label="Submit search"
            >
              <SearchIcon style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && (
            <div 
              className="search-suggestions" 
              ref={suggestionsRef}
              id="search-suggestions"
              role="listbox"
            >
              {searchHistory.length > 0 && (
                <div className="suggestion-section">
                  <div className="section-header">
                    <HistoryIcon style={{ fontSize: 16 }} />
                    <h4>Recent Searches</h4>
                    <button 
                      className="clear-history-btn"
                      onClick={clearSearchHistory}
                      aria-label="Clear all search history"
                    >
                      Clear All
                    </button>
                  </div>
                  <ul className="suggestion-list">
                    {searchHistory.map((term, index) => (
                      <li 
                        key={index} 
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(term)}
                        role="option"
                        tabIndex={0}
                      >
                        <SearchIcon className="suggestion-icon" />
                        <span className="suggestion-text">{term}</span>
                        <button 
                          className="remove-suggestion"
                          onClick={(e) => clearSingleSearch(term, e)}
                          aria-label={`Remove ${term} from history`}
                        >
                          <ClearIconSmall style={{ fontSize: 14 }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {popularSearches.length > 0 && (
                <div className="suggestion-section">
                  <div className="section-header">
                    <TrendingUpIcon style={{ fontSize: 16 }} />
                    <h4>Popular Searches</h4>
                  </div>
                  <ul className="suggestion-list">
                    {popularSearches.map((item, index) => (
                      <li 
                        key={index} 
                        className="suggestion-item popular"
                        onClick={() => handleSuggestionClick(item.term)}
                        role="option"
                        tabIndex={0}
                      >
                        <span className="popular-badge">{index + 1}</span>
                        <span className="suggestion-text">{item.term}</span>
                        <span className="search-count">{item.count} searches</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="suggestion-section">
                <div className="section-header">
                  <h4>Quick Categories</h4>
                </div>
                <div className="category-tags">
                  {['Fiction', 'Non-Fiction', 'Technology', 'Science', 'History', 'Biography'].map((category) => (
                    <button
                      key={category}
                      className="category-tag"
                      onClick={() => handleSuggestionClick(category)}
                      aria-label={`Search ${category} books`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              <div className="search-tips">
                <p className="tip-title">💡 Search Tips:</p>
                <ul className="tip-list">
                  <li>Use quotes for exact matches: <code>"Harry Potter"</code></li>
                  <li>Combine terms: <code>history AND india</code></li>
                  <li>Exclude terms: <code>fiction -novel</code></li>
                </ul>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Right - Navigation */}
      <nav className="nav-right" aria-label="Main navigation">
        <ul className={menutoggle ? 'nav-options active' : 'nav-options'} role="menubar">
          <li className="option" onClick={closeMenu} role="none">
            <Link to="/" className="nav-link" role="menuitem">
              <span className="link-text">Home</span>
            </Link>
          </li>
          <li className="option" onClick={closeMenu} role="none">
            <Link to="/books" className="nav-link" role="menuitem">
              <span className="link-text">Books</span>
            </Link>
          </li>
          <li className="option" onClick={closeMenu} role="none">
            <Link to="/events" className="nav-link" role="menuitem">
              <span className="link-text">Events</span>
            </Link>
          </li>

          {/* Admin Login Link - FIXED: Navigates to admin-login */}
          {(!user || !user.isAdmin) && (
            <li className="option admin-option" onClick={handleAdminLogin} role="none">
              <button className="nav-link admin-link" role="menuitem">
                <AdminPanelSettingsIcon className="nav-icon" aria-hidden="true" />
                <span className="link-text">Admin</span>
              </button>
            </li>
          )}

          {user ? (
            <>
              <li className="option" onClick={closeMenu} role="none">
                <Link 
                  to={user.isAdmin || user.isLibrarian ? '/admin' : '/dashboard'} 
                  className="nav-link" 
                  role="menuitem"
                >
                  <span className="link-text">Dashboard</span>
                </Link>
              </li>
              <li className="option" onClick={closeMenu} role="none">
                <Link to="/profile" className="nav-link profile-link" role="menuitem">
                  <AccountCircleIcon className="nav-icon" aria-hidden="true" />
                  <span className="link-text">Profile</span>
                </Link>
              </li>
              <li className="option logout-option" onClick={handleLogout} role="none">
                <button className="nav-link logout-link" role="menuitem">
                  <ExitToAppIcon className="nav-icon" aria-hidden="true" />
                  <span className="link-text">Logout</span>
                </button>
              </li>
            </>
          ) : (
            <>
              <li className="option" onClick={closeMenu} role="none">
                <Link to="/signin" className="nav-link" role="menuitem">
                  <span className="link-text">Sign In</span>
                </Link>
              </li>
              <li className="option register-option" onClick={closeMenu} role="none">
                <Link to="/register" className="nav-link" role="menuitem">
                  <span className="register-btn">
                    <span className="btn-text">Get Library Card</span>
                  </span>
                </Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Mobile Menu */}
      <div className="mobile-menu" onClick={Toggle}>
        <div className="menu-icon-container">
          {menutoggle ? (
            <ClearIcon className="menu-icon" aria-label="Close menu" />
          ) : (
            <MenuIcon className="menu-icon" aria-label="Open menu" />
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;