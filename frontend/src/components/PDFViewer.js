// src/components/PDFViewer.js
import React, { useState } from 'react';
import './PDFViewer.css';

function PDFViewer({ book }) {
  const [loading, setLoading] = useState(true);

  if (!book.digitalCopy.available) {
    return (
      <div className="pdf-unavailable">
        <p>Digital copy not available for this book</p>
      </div>
    );
  }

  const pdfUrl = `http://localhost:4000/api/books/pdf/${book._id}`;

  return (
    <div className="pdf-viewer">
      <div className="pdf-header">
        <h3>Reading: {book.bookName}</h3>
        <a href={pdfUrl} download className="download-btn">
          Download PDF
        </a>
      </div>
      
      <div className="pdf-container">
        {loading && <div className="pdf-loading">Loading PDF...</div>}
        <iframe
          src={pdfUrl}
          width="100%"
          height="600"
          onLoad={() => setLoading(false)}
          title={`PDF Viewer - ${book.bookName}`}
        />
      </div>
    </div>
  );
}

export default PDFViewer;