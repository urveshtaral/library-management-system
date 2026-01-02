const express = require("express");
const Book = require("../models/Book.js");

const router = express.Router();

/* Get all categories */
router.get("/all", async (req, res) => {
    try {
        const categories = await Book.distinct("categories");
        res.status(200).json(categories.filter(Boolean));
    } catch (err) {
        res.status(500).json({ message: "Error fetching categories", error: err.message });
    }
});

/* Get books by category */
router.get("/:category", async (req, res) => {
    try {
        const books = await Book.find({ categories: req.params.category });
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ message: "Error fetching category books", error: err.message });
    }
});

module.exports = router;