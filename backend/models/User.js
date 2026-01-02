// backend/models/User.js - COMPLETELY FIXED VERSION
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    userType: {
        type: String,
        required: true,
        enum: ["student", "staff", "admin", "librarian"]
    },
    userFullName: {
        type: String,
        required: true,
        trim: true
    },
    admissionId: {
        type: String,
        sparse: true,
        unique: true,
        index: true
    },
    employeeId: {
        type: String,
        sparse: true,
        unique: true,
        index: true
    },
    mobileNumber: {
        type: String,
        required: true,
        match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"],
        index: true
    },
    photo: {
        type: String,
        default: "/default-avatar.png"
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
        index: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // This hides password by default in queries
    },
    department: {
        type: String,
        default: "General"
    },
    course: {
        type: String,
        default: ""
    },
    semester: {
        type: Number,
        min: 1,
        max: 8
    },
    points: {
        type: Number,
        default: 100,
        min: 0
    },
    membershipType: {
        type: String,
        enum: ["Basic", "Premium", "Gold"],
        default: "Basic"
    },
    activeTransactions: [{
        type: mongoose.Types.ObjectId,
        ref: "BookTransaction"
    }],
    prevTransactions: [{
        type: mongoose.Types.ObjectId,
        ref: "BookTransaction"
    }],
    wishlist: [{
        type: mongoose.Types.ObjectId,
        ref: "Book"
    }],
    isAdmin: {
        type: Boolean,
        default: false
    },
    isLibrarian: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    }
}, {
    timestamps: true
});

// ✅ FIXED: Hash password before saving - ALWAYS run this
userSchema.pre('save', async function(next) {
    // Only hash if password is modified or new
    if (this.isModified('password') || this.isNew) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// ✅ FIXED: Password comparison method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        // Get the hashed password from database
        const user = await mongoose.model('User').findById(this._id).select('+password');
        
        if (!user || !user.password) {
            return false;
        }
        
        // Compare using bcrypt
        const isMatch = await bcrypt.compare(candidatePassword, user.password);
        return isMatch;
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Alternative method to compare password (simpler)
userSchema.statics.comparePassword = async function(userId, candidatePassword) {
    try {
        const user = await this.findById(userId).select('+password');
        if (!user) return false;
        
        return await bcrypt.compare(candidatePassword, user.password);
    } catch (error) {
        console.error('Password comparison error:', error);
        return false;
    }
};

// Static method to find user with password
userSchema.statics.findByCredentials = async function(admissionId, employeeId, password) {
    try {
        let user;
        
        if (admissionId) {
            user = await this.findOne({ admissionId }).select('+password');
        } else if (employeeId) {
            user = await this.findOne({ employeeId }).select('+password');
        }
        
        if (!user) {
            throw new Error('User not found');
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid password');
        }
        
        return user;
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model("User", userSchema);