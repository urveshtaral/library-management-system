import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const EnhancedSearch = ({ onSearch, placeholder = "Search..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  
  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);
  
  // Debounced search
  const debouncedSearch = useCallback(
    debounce((searchQuery) => {
      if (searchQuery.trim()) {
        onSearch(searchQuery);
        
        // Save to recent searches
        const updated = [
          searchQuery,
          ...recentSearches.filter(s => s !== searchQuery)
        ].slice(0, 5);
        
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
      }
    }, 300),
    [onSearch, recentSearches]
  );
  
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
    
    // Show suggestions
    if (value.length > 2) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };
  
  const fetchSuggestions = async (query) => {
    try {
      const response = await fetch(`/api/books/suggestions?q=${query}`);
      const data = await response.json();
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };
  
  return (
    <div className="enhanced-search">
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="search-input"
        />
        {query && (
          <button 
            className="clear-search"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              onSearch('');
            }}
          >
            ✕
          </button>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-item"
              onClick={() => {
                setQuery(suggestion);
                onSearch(suggestion);
                setSuggestions([]);
              }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
      
      {/* Recent searches */}
      {!query && recentSearches.length > 0 && (
        <div className="recent-searches">
          <small>Recent searches:</small>
          <div className="recent-tags">
            {recentSearches.map((search, index) => (
              <span
                key={index}
                className="recent-tag"
                onClick={() => {
                  setQuery(search);
                  onSearch(search);
                }}
              >
                {search}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;