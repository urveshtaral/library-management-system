const express = require("express");
const User = require("../models/User.js");
const jwt = require('jsonwebtoken');
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/profiles/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET || 'fallback_secret', 
        { expiresIn: process.env.JWT_EXPIRE || '30d' }
    );
};

/* User Registration - Fixed & Enhanced */
router.post("/register", upload.single('photo'), async (req, res) => {
    try {
        const {
            userType, userFullName, admissionId, employeeId, age, gender, dob,
            address, mobileNumber, email, password, department, course, semester
        } = req.body;

        console.log("📝 Registration attempt:", { userType, userFullName, email });

        // Validation
        if (!userType || !userFullName || !mobileNumber || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "All required fields must be filled" 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email },
                ...(admissionId ? [{ admissionId }] : []),
                ...(employeeId ? [{ employeeId }] : [])
            ].filter(Boolean)
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email or ID"
            });
        }

        // Process address (handle both string and object formats)
        let processedAddress;
        if (address) {
            if (typeof address === 'string') {
                processedAddress = { street: address, city: "Vadodara", state: "Gujarat" };
            } else if (typeof address === 'object') {
                processedAddress = address;
            }
        }

        // Create new user
        const newUser = new User({
            userType,
            userFullName,
            admissionId: userType === 'student' ? admissionId : undefined,
            employeeId: ['staff', 'admin', 'librarian'].includes(userType) ? employeeId : undefined,
            age,
            gender,
            dob,
            address: processedAddress,
            mobileNumber,
            email,
            password,
            department: department || 'General',
            course,
            semester,
            isAdmin: userType === 'admin',
            isLibrarian: userType === 'librarian',
            photo: req.file ? `/uploads/profiles/${req.file.filename}` : ""
        });

        await newUser.save();

        // Generate JWT token
        const token = generateToken(newUser._id);

        const userResponse = {
            id: newUser._id,
            userType: newUser.userType,
            userFullName: newUser.userFullName,
            admissionId: newUser.admissionId,
            employeeId: newUser.employeeId,
            email: newUser.email,
            mobileNumber: newUser.mobileNumber,
            isAdmin: newUser.isAdmin,
            isLibrarian: newUser.isLibrarian,
            department: newUser.department,
            course: newUser.course,
            semester: newUser.semester,
            photo: newUser.photo,
            points: newUser.points,
            membershipType: newUser.membershipType
        };

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                user: userResponse,
                token
            }
        });
    } catch (err) {
        console.error("❌ Registration error:", err);
        res.status(500).json({ 
            success: false,
            message: "Registration failed. Please try again.",
            error: err.message 
        });
    }
});

/* User Login - Fixed */
router.post("/signin", async (req, res) => {
    try {
        const { admissionId, employeeId, email, password } = req.body;

        console.log("🔐 Login attempt:", { admissionId, employeeId, email });

        if (!password) {
            return res.status(400).json({ 
                success: false,
                message: "Password is required" 
            });
        }

        let user;
        if (admissionId) {
            user = await User.findOne({ admissionId });
        } else if (employeeId) {
            user = await User.findOne({ employeeId });
        } else if (email) {
            user = await User.findOne({ email });
        } else {
            return res.status(400).json({ 
                success: false,
                message: "Please provide admission ID, employee ID, or email" 
            });
        }

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "User not found" 
            });
        }

        // Use comparePassword method
        const validPass = await user.comparePassword(password);
        if (!validPass) {
            return res.status(400).json({ 
                success: false,
                message: "Wrong password" 
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        const userResponse = {
            id: user._id,
            userType: user.userType,
            userFullName: user.userFullName,
            admissionId: user.admissionId,
            employeeId: user.employeeId,
            email: user.email,
            mobileNumber: user.mobileNumber,
            isAdmin: user.isAdmin,
            isLibrarian: user.isLibrarian,
            points: user.points,
            department: user.department,
            course: user.course,
            semester: user.semester,
            photo: user.photo,
            membershipType: user.membershipType
        };

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: userResponse,
                token
            }
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ 
            success: false,
            message: "Login failed. Please try again.",
            error: err.message 
        });
    }
});

/* Admin/Staff Login - Fixed */
router.post("/admin-login", async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("🔐 Admin login attempt:", { email });

        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: "Email and password are required" 
            });
        }

        const user = await User.findOne({
            email,
            $or: [
                { isAdmin: true },
                { isLibrarian: true },
                { userType: 'staff' }
            ]
        });

        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: "Admin/Librarian/Staff account not found" 
            });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid password" 
            });
        }

        const token = generateToken(user._id);

        const userResponse = {
            id: user._id,
            userType: user.userType,
            userFullName: user.userFullName,
            employeeId: user.employeeId,
            email: user.email,
            isAdmin: user.isAdmin,
            isLibrarian: user.isLibrarian,
            department: user.department,
            photo: user.photo
        };

        res.status(200).json({
            success: true,
            message: "Admin login successful!",
            data: { 
                user: userResponse,
                token: token
            }
        });

    } catch (err) {
        console.error("❌ Admin login error:", err);
        res.status(500).json({ 
            success: false,
            message: "Admin login failed. Please try again.",
            error: err.message 
        });
    }
});

// Get all users (for testing/admin purposes)
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 });
        res.status(200).json({
            success: true,
            data: users
        });
    } catch (err) {
        console.error("❌ Error fetching users:", err);
        res.status(500).json({ 
            success: false,
            message: "Error fetching users",
            error: err.message 
        });
    }
});

// Get user by ID (profile)
router.get("/profile/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id, { password: 0 });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        
        res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error("❌ Error fetching profile:", err);
        res.status(500).json({
            success: false,
            message: "Error fetching profile",
            error: err.message
        });
    }
});

module.exports = router;