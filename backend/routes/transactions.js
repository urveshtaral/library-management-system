const express = require("express");
const BookTransaction = require("../models/BookTransaction.js");
const Book = require("../models/Book.js");
const User = require("../models/User.js");

const router = express.Router();

/* Get all transactions */
router.get("/all", async (req, res) => {
    try {
        const transactions = await BookTransaction.find({})
            .populate('bookId')
            .populate('borrowerId')
            .sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (err) {
        res.status(500).json({ message: "Error fetching transactions", error: err.message });
    }
});

/* Issue a book */
router.post("/issue", async (req, res) => {
    try {
        const { bookId, borrowerId, days = 14 } = req.body;
        
        const book = await Book.findById(bookId);
        const user = await User.findById(borrowerId);
        
        if (!book || !user) {
            return res.status(404).json({ message: "Book or user not found" });
        }
        
        if (book.bookCountAvailable < 1) {
            return res.status(400).json({ message: "Book not available" });
        }
        
        const fromDate = new Date();
        const toDate = new Date();
        toDate.setDate(toDate.getDate() + days);
        
        const transaction = new BookTransaction({
            bookId,
            borrowerId,
            bookName: book.bookName,
            borrowerName: user.userFullName,
            transactionType: "Issue",
            fromDate,
            toDate,
            transactionStatus: "Active"
        });
        
        await transaction.save();
        
        // Update book availability
        book.bookCountAvailable -= 1;
        if (book.bookCountAvailable === 0) {
            book.bookStatus = "Checked Out";
        }
        await book.save();
        
        // Add to user's active transactions
        user.activeTransactions.push(transaction._id);
        await user.save();
        
        res.status(201).json({
            message: "Book issued successfully",
            transaction
        });
    } catch (err) {
        res.status(500).json({ message: "Error issuing book", error: err.message });
    }
});

/* Return a book */
router.post("/return", async (req, res) => {
    try {
        const { transactionId } = req.body;
        
        const transaction = await BookTransaction.findById(transactionId);
        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }
        
        const book = await Book.findById(transaction.bookId);
        const user = await User.findById(transaction.borrowerId);
        
        // Update transaction
        transaction.returnDate = new Date();
        transaction.transactionStatus = "Completed";
        
        // Calculate fine if overdue
        const today = new Date();
        if (today > transaction.toDate) {
            const daysOverdue = Math.ceil((today - transaction.toDate) / (1000 * 60 * 60 * 24));
            transaction.fineAmount = daysOverdue * 5; // ₹5 per day
        }
        
        await transaction.save();
        
        // Update book availability
        book.bookCountAvailable += 1;
        if (book.bookStatus === "Checked Out") {
            book.bookStatus = "Available";
        }
        await book.save();
        
        // Update user transactions
        user.activeTransactions = user.activeTransactions.filter(
            transId => transId.toString() !== transactionId
        );
        user.prevTransactions.push(transaction._id);
        await user.save();
        
        res.status(200).json({
            message: "Book returned successfully",
            transaction
        });
    } catch (err) {
        res.status(500).json({ message: "Error returning book", error: err.message });
    }
});

module.exports = router;