import React, { useState } from 'react';
import './ImageOptimizer.css';

const ImageOptimizer = ({ src, alt, className, placeholder }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`image-container ${className}`}>
      {!loaded && !error && (
        <div className="image-placeholder">
          {placeholder || <div className="placeholder-spinner" />}
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`optimized-image ${loaded ? 'loaded' : ''}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ display: loaded && !error ? 'block' : 'none' }}
      />
      
      {error && (
        <div className="image-error">
          <span>⚠️</span>
          <p>Failed to load image</p>
        </div>
      )}
    </div>
  );
};

export default ImageOptimizer;