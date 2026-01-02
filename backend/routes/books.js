const express = require("express");
const Book = require("../models/Book");
const router = express.Router();

// 🟢 CREATE - Add new book
router.post("/add", async (req, res) => {
  try {
    const bookData = req.body;
    
    // Check if book already exists
    const existingBook = await Book.findOne({ 
      $or: [
        { isbn: bookData.isbn },
        { bookName: bookData.bookName, author: bookData.author }
      ]
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: "Book already exists in the library"
      });
    }

    const newBook = new Book(bookData);
    await newBook.save();

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      data: newBook
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error adding book",
      error: err.message
    });
  }
});

// 🟢 READ - Get all books with filters
router.get("/all", async (req, res) => {
  try {
    const { 
      search, category, author, status, 
      page = 1, limit = 12, sortBy = 'createdAt' 
    } = req.query;

    let query = {};
    
    // Search functionality
    if (search) {
      query.$or = [
        { bookName: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { categories: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) query.categories = { $in: [category] };
    if (author) query.author = { $regex: author, $options: 'i' };
    if (status) query.bookStatus = status;

    const books = await Book.find(query)
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        books,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching books",
      error: err.message
    });
  }
});

// 🟢 READ - Get single book
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.status(200).json({
      success: true,
      data: book
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching book",
      error: err.message
    });
  }
});

// 🟢 UPDATE - Update book
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      data: book
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating book",
      error: err.message
    });
  }
});

// 🟢 DELETE - Delete book
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Book deleted successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting book",
      error: err.message
    });
  }
});

module.exports = router;