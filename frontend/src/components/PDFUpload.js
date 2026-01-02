import React, { useState, useRef } from 'react';
import axios from 'axios';
import './PdfUpload.css';

function PDFUpload({ book, onUploadSuccess, onCancel }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:4000/api";

  // PDF Validation Function
  const validatePDF = (file) => {
    const validTypes = ['application/pdf'];
    const maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }
    
    if (!validTypes.includes(file.type)) {
      return { valid: false, error: 'Only PDF files are allowed (.pdf extension required)' };
    }
    
    // Check file extension as additional validation
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.pdf')) {
      return { valid: false, error: 'File must have .pdf extension' };
    }
    
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return { 
        valid: false, 
        error: `File size must be less than 50MB. Your file is ${fileSizeMB}MB` 
      };
    }
    
    // Check for potentially malicious file names
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(file.name)) {
      return { 
        valid: false, 
        error: 'File name contains invalid characters. Please rename the file.' 
      };
    }
    
    return { valid: true, error: null };
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate the PDF file
    const validation = validatePDF(file);
    if (!validation.valid) {
      setError(validation.error);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedFile(file);
    setError('');
    setSuccess(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      
      // Validate the dropped file
      const validation = validatePDF(file);
      if (!validation.valid) {
        setError(validation.error);
        setSelectedFile(null);
        return;
      }
      
      setSelectedFile(file);
      setError('');
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    // Re-validate before upload
    const validation = validatePDF(selectedFile);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    const formData = new FormData();
    formData.append('pdfFile', selectedFile);
    formData.append('bookId', book._id);
    formData.append('fileName', selectedFile.name);
    formData.append('fileSize', selectedFile.size.toString());

    try {
      setUploading(true);
      setError('');
      setProgress(0);
      
      const response = await axios.post(
        `${API_URL}/books/pdf/upload/${book._id}`, 
        formData, 
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setProgress(percent);
            }
          },
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000, // 5 minutes timeout
          withCredentials: true, // Include cookies if needed
        }
      );

      if (response.data.success) {
        setSuccess(true);
        setSelectedFile(null);
        
        // Trigger success callback with updated book data
        setTimeout(() => {
          if (onUploadSuccess) {
            onUploadSuccess(response.data.data.book);
          }
        }, 1500);
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('PDF upload error:', error);
      
      if (error.code === 'ECONNABORTED') {
        setError('Upload timeout. Please try again with a smaller file or better network connection.');
      } else if (error.response?.status === 413) {
        setError('File too large. Please select a file smaller than 50MB.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Invalid file format or parameters.');
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        setError('You do not have permission to upload files.');
      } else if (error.response?.status === 404) {
        setError('Book not found. Please refresh the page and try again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later or contact support.');
      } else if (error.message.includes('Network Error')) {
        setError('Network error. Please check your connection and try again.');
      } else if (error.message.includes('timeout')) {
        setError('Connection timeout. Please check your network and try again.');
      } else {
        setError('Error uploading PDF. Please try again.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes('report') || name.includes('study')) return '📊';
    if (name.includes('book') || name.includes('novel')) return '📖';
    if (name.includes('guide') || name.includes('manual')) return '📋';
    if (name.includes('research') || name.includes('paper')) return '🔬';
    return '📄';
  };

  return (
    <div className="pdf-upload-container">
      <div className="upload-header">
        <h3>Upload Digital Copy</h3>
        <p className="book-name">{book.bookName} by {book.author}</p>
        <small className="upload-guidelines">
          • Only PDF files (.pdf extension) • Max size: 50MB • No special characters in filename
        </small>
      </div>
      
      {!selectedFile && !uploading && (
        <div 
          className="upload-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="pdf-upload"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <label htmlFor="pdf-upload" className="upload-label">
            <div className="upload-icon">📄</div>
            <div className="upload-text">
              <strong>Choose PDF File</strong>
              <span>Click to browse or drag and drop here</span>
              <small>Supports: PDF documents up to 50MB</small>
            </div>
            <div className="drop-zone-indicator">
              <span>Drop PDF here</span>
            </div>
          </label>
        </div>
      )}

      {selectedFile && !uploading && (
        <div className="file-preview">
          <div className="file-info">
            <div className="file-icon">{getFileIcon(selectedFile.name)}</div>
            <div className="file-details">
              <h4 title={selectedFile.name}>{selectedFile.name}</h4>
              <div className="file-meta">
                <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                <span className="file-type">PDF Document</span>
              </div>
              <small className="file-modified">
                Modified: {new Date(selectedFile.lastModified).toLocaleDateString()}
              </small>
            </div>
            <button 
              className="remove-file-btn"
              onClick={() => {
                setSelectedFile(null);
                setError('');
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              title="Remove file"
              aria-label="Remove selected file"
            >
              ×
            </button>
          </div>
          <div className="file-validation-status valid">
            <span className="validation-icon">✓</span>
            <span>File validated successfully</span>
          </div>
          <div className="upload-actions">
            <button 
              className="btn-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              Upload PDF
            </button>
            <button 
              className="btn-secondary"
              onClick={onCancel}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <strong>Upload Error</strong>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <div className="success-content">
            <strong>Upload Successful!</strong>
            <p>PDF has been uploaded and is now available for viewing.</p>
          </div>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-header">
            <h4>Uploading PDF...</h4>
            <span className="progress-percent">{progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <div className="progress-details">
            <div className="detail-item">
              <span className="detail-label">File:</span>
              <span className="detail-value" title={selectedFile?.name}>
                {selectedFile?.name.length > 30 
                  ? selectedFile.name.substring(0, 27) + '...' 
                  : selectedFile?.name}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Size:</span>
              <span className="detail-value">{formatFileSize(selectedFile?.size)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className="detail-value">
                {progress < 100 ? 'Uploading...' : 'Processing...'}
              </span>
            </div>
          </div>
          <div className="progress-note">
            <small>Please don't close this window until upload is complete</small>
          </div>
        </div>
      )}
    </div>
  );
}

export default PDFUpload;