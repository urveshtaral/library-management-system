// backend/models/BookTransaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    bookId: {
        type: mongoose.Types.ObjectId,
        ref: "Book",
        required: true
    },
    borrowerId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true
    },
    bookName: {
        type: String,
        required: true
    },
    borrowerName: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        required: true,
        enum: ["Issue", "Reservation", "Renewal"]
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    transactionStatus: {
        type: String,
        default: "Active",
        enum: ["Active", "Completed", "Overdue", "Cancelled"]
    },
    fineAmount: {
        type: Number,
        default: 0
    },
    finePaid: {
        type: Boolean,
        default: false
    },
    renewalCount: {
        type: Number,
        default: 0,
        max: 2
    },
    notes: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("BookTransaction", transactionSchema);