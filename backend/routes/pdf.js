// backend/routes/pdf.js - COMPLETE PDF UPLOAD & VIEW ROUTES
const express = require("express");
const multer = require("multer");
const path = require("path");
const Book = require("../models/Book");
const router = express.Router();

// Configure multer for PDF uploads
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/pdfs/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'book-' + req.params.bookId + '-' + uniqueSuffix + '.pdf');
  }
});

const pdfUpload = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// 🟢 UPLOAD PDF FOR BOOK
router.post("/upload/:bookId", pdfUpload.single('pdfFile'), async (req, res) => {
  try {
    const { bookId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded"
      });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Update book with digital copy info
    book.digitalCopy = {
      available: true,
      fileUrl: `/uploads/pdfs/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      uploadDate: new Date(),
      format: 'PDF',
      accessLevel: 'members-only'
    };

    await book.save();

    res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      data: {
        book: book,
        fileInfo: {
          name: req.file.originalname,
          size: req.file.size,
          url: `/uploads/pdfs/${req.file.filename}`
        }
      }
    });

  } catch (err) {
    console.error("PDF upload error:", err);
    res.status(500).json({
      success: false,
      message: "Error uploading PDF",
      error: err.message
    });
  }
});

// 🟢 GET PDF FILE
router.get("/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);

    if (!book || !book.digitalCopy.available) {
      return res.status(404).json({
        success: false,
        message: "PDF not available for this book"
      });
    }

    // Check user access (simplified - in production, add proper auth)
    const filePath = path.join(__dirname, '../', book.digitalCopy.fileUrl);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${book.bookName}.pdf"`);
    
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error("Error sending PDF:", err);
        res.status(500).json({
          success: false,
          message: "Error retrieving PDF"
        });
      }
    });

  } catch (err) {
    console.error("PDF retrieval error:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving PDF",
      error: err.message
    });
  }
});

// 🟢 DELETE PDF
router.delete("/:bookId", async (req, res) => {
  try {
    const { bookId } = req.params;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    // Reset digital copy info
    book.digitalCopy = {
      available: false,
      fileUrl: '',
      fileName: '',
      fileSize: 0,
      uploadDate: null
    };

    await book.save();

    res.status(200).json({
      success: true,
      message: "PDF removed successfully"
    });

  } catch (err) {
    console.error("PDF delete error:", err);
    res.status(500).json({
      success: false,
      message: "Error removing PDF",
      error: err.message
    });
  }
});

module.exports = router;