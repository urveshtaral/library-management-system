// backend/models/Book.js - COMPLETE UPDATED VERSION
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    isbn: {
        type: String,
        required: true,
        unique: true
    },
    bookName: {
        type: String,
        required: true,
        text: true
    },
    alternateTitle: {
        type: String,
        default: ""
    },
    author: {
        type: String,
        required: true,
        text: true
    },
    language: {
        type: String,
        default: "English"
    },
    publisher: {
        type: String,
        default: ""
    },
    publicationYear: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear()
    },
    edition: {
        type: String,
        default: "1st"
    },
    bookCountAvailable: {
        type: Number,
        required: true,
        min: 0
    },
    totalCopies: {
        type: Number,
        required: true,
        min: 1
    },
    bookStatus: {
        type: String,
        default: "Available",
        enum: ["Available", "Checked Out", "Reserved", "Under Maintenance", "Lost"]
    },
    categories: [{
        type: String
    }],
    description: {
        type: String,
        default: ""
    },
    coverImage: {
        type: String,
        default: ""
    },
    location: {
        rack: String,
        shelf: String,
        position: String
    },
    tags: [{
        type: String
    }],
    rating: {
        average: { type: Number, min: 0, max: 5, default: 0 },
        count: { type: Number, default: 0 }
    },
    reviews: [{
        user: { type: mongoose.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now }
    }],
    popularity: {
        type: Number,
        default: 0
    },
    pages: {
        type: Number,
        min: 1
    },
    keywords: [String],
    digitalCopy: {
        available: { type: Boolean, default: false },
        fileUrl: String,
        fileName: String,
        fileSize: Number,
        uploadDate: { type: Date, default: Date.now },
        format: { type: String, default: 'PDF' },
        accessLevel: { 
            type: String, 
            enum: ['public', 'members-only', 'premium', 'restricted'], 
            default: 'members-only' 
        },
        downloadCount: { type: Number, default: 0 },
        lastAccessed: { type: Date }
    },
    // Additional fields for better search and filtering
    searchKeywords: [{
        type: String,
        text: true
    }],
    metadata: {
        addedBy: { type: mongoose.Types.ObjectId, ref: "User" },
        source: String,
        acquisitionDate: { type: Date, default: Date.now },
        cost: Number,
        condition: { 
            type: String, 
            enum: ['excellent', 'good', 'fair', 'poor', 'replacement-needed'],
            default: 'good'
        }
    },
    // For book recommendations
    similarBooks: [{
        type: mongoose.Types.ObjectId,
        ref: "Book"
    }],
    // Reading statistics
    readCount: { type: Number, default: 0 },
    borrowCount: { type: Number, default: 0 },
    reservationCount: { type: Number, default: 0 },
    // Audit fields
    lastBorrowed: Date,
    lastReturned: Date
}, {
    timestamps: true
});

// Text index for search functionality
bookSchema.index({
    bookName: 'text',
    author: 'text',
    categories: 'text',
    tags: 'text',
    keywords: 'text',
    searchKeywords: 'text'
});

// Compound indexes for common queries
bookSchema.index({ categories: 1, bookStatus: 1 });
bookSchema.index({ author: 1, publicationYear: -1 });
bookSchema.index({ popularity: -1 });
bookSchema.index({ 'rating.average': -1 });
bookSchema.index({ 'digitalCopy.available': 1 });

// Virtual for checking if book is available
bookSchema.virtual('isAvailable').get(function() {
    return this.bookCountAvailable > 0 && this.bookStatus === 'Available';
});

// Virtual for digital file info
bookSchema.virtual('digitalFileInfo').get(function() {
    if (!this.digitalCopy.available) {
        return null;
    }
    return {
        fileName: this.digitalCopy.fileName,
        fileSize: this.digitalCopy.fileSize,
        format: this.digitalCopy.format,
        uploadDate: this.digitalCopy.uploadDate,
        accessLevel: this.digitalCopy.accessLevel
    };
});

// Method to update popularity
bookSchema.methods.updatePopularity = function() {
    const borrowWeight = this.borrowCount * 2;
    const readWeight = this.readCount * 1.5;
    const reservationWeight = this.reservationCount * 1.2;
    const ratingWeight = this.rating.average * 20;
    
    this.popularity = borrowWeight + readWeight + reservationWeight + ratingWeight;
    return this.save();
};

// Method to add a review
bookSchema.methods.addReview = function(userId, rating, comment) {
    const review = {
        user: userId,
        rating: rating,
        comment: comment,
        createdAt: new Date()
    };
    
    this.reviews.push(review);
    
    // Update average rating
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating.average = totalRating / this.reviews.length;
    this.rating.count = this.reviews.length;
    
    return this.save();
};

// Method to check digital access
bookSchema.methods.canAccessDigital = function(userType) {
    if (!this.digitalCopy.available) {
        return false;
    }
    
    const accessLevel = this.digitalCopy.accessLevel;
    
    switch (accessLevel) {
        case 'public':
            return true;
        case 'members-only':
            return userType !== 'guest';
        case 'premium':
            return userType === 'premium' || userType === 'admin';
        case 'restricted':
            return userType === 'admin' || userType === 'librarian';
        default:
            return false;
    }
};

// Static method to find available books
bookSchema.statics.findAvailable = function() {
    return this.find({
        bookCountAvailable: { $gt: 0 },
        bookStatus: 'Available'
    });
};

// Static method to find popular books
bookSchema.statics.findPopular = function(limit = 10) {
    return this.find()
        .sort({ popularity: -1, 'rating.average': -1 })
        .limit(limit);
};

// Static method to find books by category
bookSchema.statics.findByCategory = function(category) {
    return this.find({ categories: category });
};

// Static method to search books
bookSchema.statics.searchBooks = function(query, options = {}) {
    const searchQuery = {
        $text: { $search: query }
    };
    
    // Add filters if provided
    if (options.category) {
        searchQuery.categories = options.category;
    }
    if (options.availability === 'available') {
        searchQuery.bookCountAvailable = { $gt: 0 };
    }
    if (options.author) {
        searchQuery.author = new RegExp(options.author, 'i');
    }
    
    return this.find(searchQuery)
        .sort({ score: { $meta: "textScore" } })
        .select({ score: { $meta: "textScore" } });
};

// Pre-save middleware to update search keywords
bookSchema.pre('save', function(next) {
    // Generate search keywords from relevant fields
    this.searchKeywords = [
        this.bookName,
        this.alternateTitle,
        this.author,
        ...this.categories,
        ...this.tags,
        ...this.keywords,
        this.publisher
    ].filter(keyword => keyword && keyword.trim() !== '');
    
    // Update book status based on availability
    if (this.bookCountAvailable === 0 && this.bookStatus === 'Available') {
        this.bookStatus = 'Checked Out';
    } else if (this.bookCountAvailable > 0 && this.bookStatus === 'Checked Out') {
        this.bookStatus = 'Available';
    }
    
    next();
});

// Pre-save middleware to update digital copy availability
bookSchema.pre('save', function(next) {
    if (this.digitalCopy.fileUrl && !this.digitalCopy.available) {
        this.digitalCopy.available = true;
        this.digitalCopy.uploadDate = new Date();
    }
    
    if (!this.digitalCopy.fileUrl && this.digitalCopy.available) {
        this.digitalCopy.available = false;
    }
    
    next();
});

module.exports = mongoose.model("Book", bookSchema);