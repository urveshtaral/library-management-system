const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');
const http = require('http');
require('dotenv').config();

// ==================== LOGGER CONFIGURATION ====================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// ==================== SERVER SETUP ====================
const app = express();
const server = http.createServer(app);

// ==================== SOCKET.IO SETUP ====================
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://localhost:4000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Store connected users
const connectedUsers = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production'
    );
    
    socket.userId = decoded.id;
    socket.isAdmin = decoded.isAdmin;
    socket.isLibrarian = decoded.isLibrarian;
    
    // Store user connection
    connectedUsers.set(socket.userId, socket.id);
    
    next();
  } catch (error) {
    logger.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id} | User: ${socket.userId}`);
  
  // Join user-specific room
  socket.join(`user-${socket.userId}`);
  
  // Join admin room if admin/librarian
  if (socket.isAdmin || socket.isLibrarian) {
    socket.join('admin-room');
  }
  
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  socket.on('join-room', (roomName) => {
    socket.join(roomName);
    logger.info(`Socket ${socket.id} joined room: ${roomName}`);
  });
  
  socket.on('leave-room', (roomName) => {
    socket.leave(roomName);
    logger.info(`Socket ${socket.id} left room: ${roomName}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
    connectedUsers.delete(socket.userId);
  });
});

// Make socket.io available in routes
app.set('socketio', io);

// ==================== SECURITY MIDDLEWARE ====================
app.use(helmet({
  contentSecurityPolicy: false // Disabled for simplicity, enable in production
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Compression middleware
app.use(compression());

// HTTP logger middleware
app.use(morgan('combined', { 
  stream: { 
    write: (message) => logger.info(message.trim()) 
  } 
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:4000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.use(express.static(path.join(__dirname, 'public')));

// ==================== FILE UPLOAD CONFIGURATION ====================
// Create upload directories if they don't exist
const uploadDirs = [
  'uploads', 
  'uploads/profiles', 
  'uploads/book-covers', 
  'uploads/event-images', 
  'uploads/general',
  'pdfs',
  'logs'
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`📁 Created directory: ${dir}`);
  }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      let uploadPath = 'uploads/';
      
      if (file.fieldname === 'photo') {
        uploadPath += 'profiles/';
      } else if (file.fieldname === 'coverImage') {
        uploadPath += 'book-covers/';
      } else if (file.fieldname === 'image') {
        uploadPath += 'event-images/';
      } else if (file.fieldname === 'pdf') {
        uploadPath = 'pdfs/';
      } else {
        uploadPath += 'general/';
      }
      
      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const originalName = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '_' + originalName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1 
  }
});

// Fix Mongoose deprecation warnings
mongoose.set('strictQuery', true);

// ==================== MONGODB CONNECTION ====================
// Docker-aware MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 
  (process.env.NODE_ENV === 'production' 
    ? 'mongodb://localhost:27017/library_vadodara' 
    : 'mongodb://library-mongo:27017/library_vadodara');

const MAX_RETRIES = 5;
let retryCount = 0;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 5,
      retryWrites: true,
      retryReads: true
    });
    logger.info('✅ MongoDB Connected Successfully');
    logger.info(`📊 Database: ${mongoose.connection.db.databaseName}`);
    retryCount = 0; // Reset retry count on successful connection
  } catch (err) {
    logger.error('❌ MongoDB Connection Error:', err.message);
    
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      const delay = Math.min(5000 * retryCount, 30000); // Exponential backoff, max 30 seconds
      logger.info(`🔄 Retrying connection in ${delay/1000} seconds... (Attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(connectDB, delay);
    } else {
      logger.error('❌ Max retry attempts reached. Please check MongoDB connection.');
      process.exit(1);
    }
  }
};

// MongoDB connection events
mongoose.connection.on('error', err => {
  logger.error('❌ MongoDB Error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('⚠️ MongoDB Disconnected');
  if (retryCount < MAX_RETRIES) {
    setTimeout(connectDB, 5000);
  }
});

mongoose.connection.on('reconnected', () => {
  logger.info('🔄 MongoDB Reconnected');
  retryCount = 0;
});

// ==================== IMPORT MODELS ====================
const User = require('./models/User');
const Book = require('./models/Book');
const BookTransaction = require('./models/BookTransaction');
const Event = require('./models/Event');
const Notification = require('./models/Notification');

// ==================== HELPER FUNCTIONS ====================
const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};

const validatePhone = (phone) => {
  const re = /^[0-9]{10}$/;
  return re.test(phone);
};

const generateToken = (id, isAdmin = false, isLibrarian = false) => {
  return jwt.sign(
    { 
      id, 
      isAdmin, 
      isLibrarian 
    }, 
    process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production', 
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// Socket notification helper
const sendNotification = (event, data, target = 'all') => {
  try {
    const io = app.get('socketio');
    if (target === 'all') {
      io.emit(event, data);
    } else if (target === 'admin') {
      io.to('admin-room').emit(event, data);
    } else if (target.startsWith('user-')) {
      io.to(target).emit(event, data);
    }
    logger.info(`📢 Notification sent: ${event} to ${target}`);
  } catch (error) {
    logger.error('Error sending notification:', error);
  }
};

// ✅ Helper function to get current stats
const getCurrentStats = async () => {
  const [books, users, transactions, overdueCount, availableBooks] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments({ userType: { $in: ['student', 'staff'] } }),
    BookTransaction.countDocuments({ transactionStatus: 'Active' }),
    BookTransaction.countDocuments({ 
      transactionStatus: 'Active',
      toDate: { $lt: new Date() }
    }),
    Book.countDocuments({ bookCountAvailable: { $gt: 0 } })
  ]);
  return { books, users, transactions, overdueCount, availableBooks };
};

// ==================== AUTHENTICATION MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production');
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (!req.user.isAdmin && !req.user.isLibrarian) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

// ==================== HEALTH CHECK ====================
app.get("/api/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const [userCount, bookCount, eventCount] = await Promise.all([
      User.countDocuments(),
      Book.countDocuments(),
      Event.countDocuments()
    ]);
    
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    const healthData = { 
      success: true,
      message: "Server is running perfectly!", 
      data: {
        server: {
          status: 'healthy',
          uptime: `${Math.floor(uptime / 60)} minutes`,
          timestamp: new Date().toISOString()
        },
        database: {
          status: dbStatus,
          userCount,
          bookCount,
          eventCount
        },
        system: {
          memory: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB used`,
          platform: process.platform,
          nodeVersion: process.version
        },
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    logger.info('✅ Health check passed');
    res.status(200).json(healthData);
  } catch (err) {
    logger.error('❌ Health check error:', err);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== AUTH ROUTES ====================

// 🟢 USER REGISTRATION
app.post("/api/auth/register", upload.single('photo'), async (req, res) => {
  try {
    const {
      userType, userFullName, admissionId, employeeId, mobileNumber,
      email, password, confirmPassword, department, course, semester
    } = req.body;

    logger.info("📝 Registration attempt:", { userType, userFullName, email });

    // Validation
    if (!userType || !userFullName || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match"
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    if (!validatePhone(mobileNumber)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid mobile number (must be 10 digits)" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters long" 
      });
    }

    // Check existing user
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        ...(admissionId ? [{ admissionId }] : []),
        ...(employeeId ? [{ employeeId }] : [])
      ].filter(Boolean)
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: existingUser.email === email ? 
          "Email already registered" : "ID already registered" 
      });
    }

    // Set proper flags based on user type
    const isAdmin = userType === 'admin';
    const isLibrarian = userType === 'librarian';

    // Create new user
    const newUser = new User({
      userType,
      userFullName,
      admissionId: userType === 'student' ? admissionId : undefined,
      employeeId: ['staff', 'admin', 'librarian'].includes(userType) ? employeeId : undefined,
      mobileNumber,
      email: email.toLowerCase(),
      password,
      department: department || 'General',
      course,
      semester,
      isAdmin,
      isLibrarian,
      photo: req.file ? `/uploads/profiles/${req.file.filename}` : "/default-avatar.png"
    });

    await newUser.save();

    logger.info("✅ User registered successfully:", newUser._id);

    // Generate token
    const token = generateToken(newUser._id, newUser.isAdmin, newUser.isLibrarian);

    // Don't send password back
    const userResponse = {
      _id: newUser._id,
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
      membershipType: newUser.membershipType,
      createdAt: newUser.createdAt
    };

    // Send notification to admins
    sendNotification('newRegistration', userResponse, 'admin');

    res.status(201).json({
      success: true,
      message: "Registration successful! Please login.",
      data: { 
        user: userResponse,
        token: token
      }
    });

  } catch (err) {
    logger.error("❌ Registration error:", err);
    
    // Handle file upload errors
    if (req.file) {
      const filePath = path.join(__dirname, req.file.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: "Registration failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 USER LOGIN (Students & Staff)
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { admissionId, employeeId, password } = req.body;

    logger.info("🔐 User login attempt:", { admissionId, employeeId });

    if (!password) {
      return res.status(400).json({ 
        success: false,
        message: "Password is required" 
      });
    }

    if (!admissionId && !employeeId) {
      return res.status(400).json({ 
        success: false,
        message: "Please provide Admission ID or Employee ID" 
      });
    }

    // Find user
    let user;
    if (admissionId) {
      user = await User.findOne({ 
        admissionId,
        userType: { $in: ['student', 'staff', 'admin', 'librarian'] }
      });
    } else {
      user = await User.findOne({ 
        employeeId,
        userType: { $in: ['staff', 'admin', 'librarian'] }
      });
    }
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated. Please contact administrator." 
      });
    }

    // Use model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.isAdmin, user.isLibrarian);

    const userResponse = {
      _id: user._id,
      id: user._id,
      userType: user.userType,
      userFullName: user.userFullName,
      admissionId: user.admissionId,
      employeeId: user.employeeId,
      email: user.email,
      mobileNumber: user.mobileNumber,
      isAdmin: user.isAdmin,
      isLibrarian: user.isLibrarian,
      department: user.department,
      course: user.course,
      semester: user.semester,
      points: user.points,
      photo: user.photo,
      membershipType: user.membershipType,
      createdAt: user.createdAt
    };

    logger.info("✅ User login successful:", user.userFullName);

    res.status(200).json({
      success: true,
      message: "Login successful!",
      data: { 
        user: userResponse,
        token: token
      }
    });

  } catch (err) {
    logger.error("❌ Login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Login failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 ADMIN/LIBRARIAN LOGIN
app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { email, password } = req.body;

    logger.info("🔐 Admin login attempt:", { email });

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      $or: [
        { isAdmin: true },
        { isLibrarian: true },
        { userType: { $in: ['admin', 'librarian'] } }
      ]
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({ 
        success: false,
        message: "Account is deactivated." 
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id, user.isAdmin, user.isLibrarian);

    const userResponse = {
      _id: user._id,
      id: user._id,
      userType: user.userType,
      userFullName: user.userFullName,
      employeeId: user.employeeId,
      email: user.email,
      mobileNumber: user.mobileNumber,
      isAdmin: user.isAdmin,
      isLibrarian: user.isLibrarian,
      department: user.department,
      photo: user.photo,
      points: user.points,
      membershipType: user.membershipType,
      createdAt: user.createdAt
    };

    logger.info("✅ Admin login successful:", user.userFullName);

    res.status(200).json({
      success: true,
      message: "Admin login successful!",
      data: { 
        user: userResponse,
        token: token
      }
    });

  } catch (err) {
    logger.error("❌ Admin login error:", err);
    res.status(500).json({ 
      success: false,
      message: "Admin login failed. Please try again.",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== USER PROFILE ROUTES ====================

// 🟢 GET USER PROFILE
app.get("/api/users/profile/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if requesting own profile or has admin privileges
    if (userId !== req.user.id && !req.user.isAdmin && !req.user.isLibrarian) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    const user = await User.findById(userId)
      .select('-password -__v')
      .populate({
        path: 'activeTransactions',
        populate: { path: 'bookId', select: 'bookName author coverImage' }
      })
      .populate({
        path: 'prevTransactions',
        populate: { path: 'bookId', select: 'bookName author' }
      })
      .populate({
        path: 'wishlist',
        select: 'bookName author coverImage bookCountAvailable'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      data: user  // Return user directly, not nested in data.user
    });

  } catch (err) {
    logger.error('❌ Profile fetch error:', err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 UPDATE USER PROFILE
app.put("/api/users/profile/:id", authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Check if updating own profile or has admin privileges
    if (userId !== req.user.id && !req.user.isAdmin && !req.user.isLibrarian) {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Remove restricted fields
    delete updates.password;
    delete updates.isAdmin;
    delete updates.isLibrarian;
    delete updates._id;
    delete updates.id;

    // Handle photo upload
    if (req.file) {
      updates.photo = `/uploads/profiles/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user
    });

  } catch (err) {
    logger.error('❌ Update profile error:', err);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 GET USER BY ID
app.get("/api/users/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }
    
    const user = await User.findById(userId)
      .select('-password -__v')
      .populate('activeTransactions')
      .populate('prevTransactions');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: { user }
    });
  } catch (err) {
    logger.error('❌ Get user error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching user", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 GET ALL USERS (ADMIN ONLY)
app.get("/api/users", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', userType = '' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    let query = {};
    
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { userFullName: searchRegex },
        { email: searchRegex },
        { admissionId: searchRegex },
        { employeeId: searchRegex }
      ];
    }
    
    if (userType) {
      query.userType = userType;
    }
    
    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);
    
    const total = await User.countDocuments(query);
    
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: {
        users,
        pagination: {
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (err) {
    logger.error('❌ Get all users error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching users", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== DASHBOARD ROUTES ====================

// 🟢 DASHBOARD STATS
app.get("/api/dashboard/stats", authMiddleware, async (req, res) => {
  try {
    const isAdmin = req.user.isAdmin || req.user.isLibrarian;
    
    let stats;
    if (isAdmin) {
      // Admin dashboard stats
      const [
        totalBooks,
        totalUsers,
        activeTransactions,
        overdueBooks,
        totalEvents,
        newUsersThisMonth,
        availableBooks
      ] = await Promise.all([
        Book.countDocuments(),
        User.countDocuments({ userType: { $in: ['student', 'staff'] } }),
        BookTransaction.countDocuments({ transactionStatus: 'Active' }),
        BookTransaction.countDocuments({ 
          transactionStatus: 'Active',
          toDate: { $lt: new Date() }
        }),
        Event.countDocuments({ date: { $gte: new Date() } }),
        User.countDocuments({ 
          createdAt: { $gte: new Date(new Date().setDate(1)) }
        }),
        Book.countDocuments({ bookCountAvailable: { $gt: 0 } })
      ]);
      
      // Calculate total due fines
      const overdueTransactions = await BookTransaction.find({
        transactionStatus: 'Active',
        toDate: { $lt: new Date() }
      });
      
      const totalDueFines = overdueTransactions.reduce((sum, trans) => {
        const daysOverdue = Math.ceil((new Date() - new Date(trans.toDate)) / (1000 * 60 * 60 * 24));
        return sum + (daysOverdue * 5);
      }, 0);
      
      // Calculate total fines paid
      const paidFinesResult = await BookTransaction.aggregate([
        { $match: { finePaid: true } },
        { $group: { _id: null, total: { $sum: "$fineAmount" } } }
      ]);
      
      const totalFinesPaid = paidFinesResult[0]?.total || 0;
      
      stats = {
        totalBooks,
        totalUsers,
        activeTransactions,
        overdueBooks,
        totalDueFines,
        totalFinesPaid,
        totalEvents,
        newUsersThisMonth,
        availableBooks,
        userType: 'admin'
      };
    } else {
      // Member dashboard stats
      const user = await User.findById(req.user.id)
        .populate('activeTransactions')
        .populate('prevTransactions')
        .populate('wishlist');
      
      const overdueBooks = await BookTransaction.countDocuments({
        borrowerId: req.user.id,
        transactionStatus: 'Active',
        toDate: { $lt: new Date() }
      });
      
      // Calculate pending fines
      const overdueTransactions = await BookTransaction.find({
        borrowerId: req.user.id,
        transactionStatus: 'Active',
        toDate: { $lt: new Date() }
      });
      
      const pendingFines = overdueTransactions.reduce((sum, trans) => {
        const daysOverdue = Math.ceil((new Date() - new Date(trans.toDate)) / (1000 * 60 * 60 * 24));
        return sum + (daysOverdue * 5);
      }, 0);
      
      stats = {
        activeBooks: user.activeTransactions.length,
        totalBooksRead: user.prevTransactions.length,
        wishlistCount: user.wishlist.length,
        points: user.points || 0,
        overdueBooks,
        pendingFines,
        userType: 'member'
      };
    }
    
    res.status(200).json({
      success: true,
      message: "Dashboard stats fetched successfully",
      data: stats
    });
    
  } catch (err) {
    logger.error('❌ Dashboard stats error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching dashboard stats", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== BOOK ROUTES ====================

// 🟢 GET ALL BOOKS
app.get("/api/books/allbooks", async (req, res) => {
  try {
    const { 
      search, 
      category, 
      availability, 
      sortBy = 'createdAt', 
      page = 1, 
      limit = 12,
      author,
      hasDigital = false
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (pageNum < 1 || limitNum < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid pagination parameters"
      });
    }
    
    let query = {};
    
    // Search functionality
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { bookName: searchRegex },
        { author: searchRegex },
        { description: searchRegex },
        { categories: { $in: [searchRegex] } },
        { tags: { $in: [searchRegex] } },
        { isbn: searchRegex }
      ];
    }
    
    if (category && category !== 'all') {
      query.categories = { $in: [category] };
    }
    
    if (author) {
      query.author = new RegExp(author, 'i');
    }
    
    if (availability === 'available') {
      query.bookCountAvailable = { $gt: 0 };
      query.bookStatus = "Available";
    } else if (availability === 'unavailable') {
      query.bookCountAvailable = 0;
      query.bookStatus = "Checked Out";
    }
    
    if (hasDigital === 'true') {
      query['digitalCopy.available'] = true;
    }
    
    let sortOptions = {};
    switch(sortBy) {
      case 'popularity':
        sortOptions = { popularity: -1 };
        break;
      case 'rating':
        sortOptions = { 'rating.average': -1, 'rating.count': -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'title':
        sortOptions = { bookName: 1 };
        break;
      case 'author':
        sortOptions = { author: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    const books = await Book.find(query)
      .select('-__v')
      .sort(sortOptions)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();
    
    const total = await Book.countDocuments(query);
    
    // Format books with full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formattedBooks = books.map(book => ({
      ...book,
      coverImage: book.coverImage ? `${baseUrl}${book.coverImage}` : null,
      digitalCopy: book.digitalCopy ? {
        ...book.digitalCopy,
        fileUrl: book.digitalCopy.fileUrl ? `${baseUrl}/pdfs/${book.digitalCopy.fileUrl}` : null
      } : null
    }));
    
    res.status(200).json({
      success: true,
      message: "Books fetched successfully",
      data: {
        books: formattedBooks,
        pagination: {
          totalPages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          totalItems: total,
          itemsPerPage: limitNum
        }
      }
    });
  } catch (err) {
    logger.error('❌ Fetch books error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching books", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 ADD NEW BOOK (ADMIN ONLY)
app.post("/api/books/add", authMiddleware, adminMiddleware, upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'pdf', maxCount: 1 }
]), async (req, res) => {
  try {
    const {
      isbn, bookName, author, bookCountAvailable, totalCopies,
      categories, description, publicationYear, publisher,
      pages, language, edition
    } = req.body;

    if (!isbn || !bookName || !author) {
      return res.status(400).json({
        success: false,
        message: "ISBN, book name, and author are required"
      });
    }

    // Check if book already exists
    const existingBook = await Book.findOne({ 
      $or: [
        { isbn },
        { bookName: new RegExp(`^${bookName}$`, 'i') }
      ]
    });

    if (existingBook) {
      return res.status(400).json({
        success: false,
        message: "Book with this ISBN or name already exists"
      });
    }

    const bookData = {
      isbn,
      bookName,
      author,
      bookCountAvailable: parseInt(bookCountAvailable) || 1,
      totalCopies: parseInt(totalCopies) || 1,
      categories: categories ? categories.split(',').map(cat => cat.trim()) : ['General'],
      description,
      publicationYear: parseInt(publicationYear) || new Date().getFullYear(),
      publisher: publisher || 'Unknown',
      pages: parseInt(pages) || 0,
      language: language || 'English',
      edition: edition || '1st',
      rating: {
        average: 0,
        count: 0
      },
      popularity: 0,
      bookStatus: "Available"
    };

    // Handle cover image
    if (req.files && req.files.coverImage) {
      bookData.coverImage = `/uploads/book-covers/${req.files.coverImage[0].filename}`;
    }

    // Handle digital copy
    if (req.files && req.files.pdf) {
      bookData.digitalCopy = {
        available: true,
        fileUrl: req.files.pdf[0].filename,
        uploadedAt: new Date()
      };
    }

    const newBook = new Book(bookData);
    await newBook.save();

    logger.info("✅ Book added successfully:", newBook._id);

    // Send notification to all users
    sendNotification('newBookAdded', newBook, 'all');

    res.status(201).json({
      success: true,
      message: "Book added successfully!",
      data: newBook
    });
  } catch (err) {
    logger.error("❌ Add book error:", err);
    
    // Clean up uploaded files on error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          const filePath = path.join(__dirname, file.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error adding book", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 GET BOOK BY ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID"
      });
    }
    
    const book = await Book.findById(bookId)
      .populate({
        path: 'reviews.userId',
        select: 'userFullName photo'
      })
      .lean();
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }
    
    // Format with full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    book.coverImage = book.coverImage ? `${baseUrl}${book.coverImage}` : null;
    if (book.digitalCopy) {
      book.digitalCopy.fileUrl = book.digitalCopy.fileUrl ? 
        `${baseUrl}/pdfs/${book.digitalCopy.fileUrl}` : null;
    }
    
    res.status(200).json({
      success: true,
      message: "Book fetched successfully",
      data: book
    });
  } catch (err) {
    logger.error('❌ Get book error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching book", 
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== TRANSACTION ROUTES ====================

// 🟢 ISSUE BOOK TRANSACTION
app.post("/api/transactions/issue", authMiddleware, async (req, res) => {
  try {
    const { bookId, days = 14 } = req.body;
    const userId = req.user.id;
    
    logger.info('📚 Issuing book:', { bookId, userId, days });
    
    if (!bookId || days < 1 || days > 30) {
      return res.status(400).json({
        success: false,
        message: "Invalid request parameters. Days must be between 1 and 30."
      });
    }
    
    const [book, user] = await Promise.all([
      Book.findById(bookId),
      User.findById(userId)
    ]);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    if (book.bookCountAvailable < 1) {
      return res.status(400).json({
        success: false,
        message: "Book not available for borrowing"
      });
    }
    
    // Check if user already has this book
    const existingTransaction = await BookTransaction.findOne({
      bookId,
      borrowerId: userId,
      transactionStatus: "Active"
    });
    
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: "You already have this book issued"
      });
    }
    
    // Check user's active transactions count
    const activeTransactionCount = await BookTransaction.countDocuments({
      borrowerId: userId,
      transactionStatus: "Active"
    });
    
    if (activeTransactionCount >= 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum borrowing limit reached (5 books)"
      });
    }
    
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + parseInt(days));
    
    const transaction = new BookTransaction({
      bookId,
      borrowerId: userId,
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
    
    logger.info('✅ Book issued successfully');
    
    // Send notification to user
    sendNotification('bookBorrowed', {
      userId,
      bookName: book.bookName,
      transactionId: transaction._id,
      dueDate: toDate
    }, `user-${userId}`);
    
    res.status(201).json({
      success: true,
      message: "Book issued successfully",
      data: { 
        transaction: {
          ...transaction.toObject(),
          dueDate: toDate,
          remainingDays: Math.ceil((toDate - new Date()) / (1000 * 60 * 60 * 24))
        }
      }
    });
  } catch (err) {
    logger.error('❌ Issue book error:', err);
    res.status(500).json({
      success: false,
      message: "Error issuing book",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 RETURN BOOK TRANSACTION (ADMIN ONLY)
app.post("/api/transactions/return", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    logger.info('📚 Returning book:', { transactionId });
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID is required"
      });
    }
    
    const transaction = await BookTransaction.findById(transactionId)
      .populate('bookId')
      .populate('borrowerId');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }
    
    const book = transaction.bookId;
    const user = transaction.borrowerId;
    
    // Update transaction
    transaction.returnDate = new Date();
    transaction.transactionStatus = "Completed";
    
    // Calculate fine if overdue
    const today = new Date();
    if (today > transaction.toDate) {
      const daysOverdue = Math.ceil((today - transaction.toDate) / (1000 * 60 * 60 * 24));
      transaction.fineAmount = daysOverdue * 5;
      transaction.isOverdue = true;
    }
    
    await transaction.save();
    
    // Update book availability
    if (book) {
      book.bookCountAvailable += 1;
      if (book.bookStatus === "Checked Out" && book.bookCountAvailable > 0) {
        book.bookStatus = "Available";
      }
      await book.save();
    }
    
    // Update user transactions
    if (user) {
      user.activeTransactions = user.activeTransactions.filter(
        transId => transId.toString() !== transactionId
      );
      user.prevTransactions.push(transaction._id);
      await user.save();
    }
    
    logger.info('✅ Book returned successfully');
    
    // Send notification to user
    sendNotification('bookReturned', {
      userId: user._id,
      bookName: book.bookName,
      transactionId: transaction._id
    }, `user-${user._id}`);
    
    res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: { transaction }
    });
  } catch (err) {
    logger.error('❌ Return book error:', err);
    res.status(500).json({
      success: false,
      message: "Error returning book",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// 🟢 GET USER TRANSACTIONS
app.get("/api/transactions/my-transactions", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const transactions = await BookTransaction.find({ borrowerId: userId })
      .sort({ fromDate: -1 })
      .populate('bookId', 'bookName author coverImage')
      .lean();
    
    res.status(200).json({
      success: true,
      message: "Transactions fetched successfully",
      data: { transactions }
    });
  } catch (err) {
    logger.error('❌ Get transactions error:', err);
    res.status(500).json({
      success: false,
      message: "Error fetching transactions",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== EVENT ROUTES ====================

// 🟢 GET ALL EVENTS
app.get("/api/events/allevents", async (req, res) => {
  try {
    const { upcoming = true, limit = 10 } = req.query;
    
    let query = {};
    if (upcoming === 'true') {
      query.date = { $gte: new Date() };
    }
    
    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(parseInt(limit))
      .lean();
    
    // Format with full URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formattedEvents = events.map(event => ({
      ...event,
      image: event.image ? `${baseUrl}${event.image}` : null
    }));
    
    res.status(200).json({
      success: true,
      message: "Events fetched successfully",
      data: formattedEvents
    });
  } catch (err) {
    logger.error('❌ Get events error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error fetching events" 
    });
  }
});

// 🟢 ADD NEW EVENT (ADMIN ONLY)
app.post("/api/events/add", authMiddleware, adminMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, location, type } = req.body;
    
    if (!title || !description || !date || !location) {
      return res.status(400).json({
        success: false,
        message: "Title, description, date, and location are required"
      });
    }
    
    const event = new Event({
      title,
      description,
      date: new Date(date),
      location,
      type: type || 'General',
      image: req.file ? `/uploads/event-images/${req.file.filename}` : null,
      participants: []
    });
    
    await event.save();
    
    logger.info('✅ Event added successfully:', event._id);
    
    // Send notification to all users
    sendNotification('newEventAdded', event, 'all');
    
    res.status(201).json({
      success: true,
      message: "Event added successfully",
      data: event
    });
  } catch (err) {
    logger.error('❌ Add event error:', err);
    res.status(500).json({ 
      success: false,
      message: "Error adding event" 
    });
  }
});

// ==================== NOTIFICATION ROUTES ====================

// 🟢 GET USER NOTIFICATIONS
app.get("/api/notifications", authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const notifications = await Notification.find({
      $or: [
        { userId: req.user.id },
        { target: 'all' }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .populate('userId', 'userFullName photo')
    .lean();
    
    // Mark as read
    await Notification.updateMany(
      { 
        userId: req.user.id, 
        read: false 
      },
      { 
        read: true,
        readAt: new Date() 
      }
    );
    
    res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: {
        notifications,
        unreadCount: await Notification.countDocuments({ userId: req.user.id, read: false })
      }
    });
  } catch (err) {
    logger.error('❌ Get notifications error:', err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching notifications" 
    });
  }
});

// ==================== WISHLIST ROUTES ====================

// 🟢 ADD TO WISHLIST
app.post("/api/wishlist/add", authMiddleware, async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;
    
    if (!bookId) {
      return res.status(400).json({
        success: false,
        message: "Book ID is required"
      });
    }
    
    const user = await User.findById(userId);
    const book = await Book.findById(bookId);
    
    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found"
      });
    }
    
    // Check if already in wishlist
    if (user.wishlist.includes(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Book already in wishlist"
      });
    }
    
    user.wishlist.push(bookId);
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Book added to wishlist",
      data: { wishlist: user.wishlist }
    });
  } catch (err) {
    logger.error('❌ Add to wishlist error:', err);
    res.status(500).json({
      success: false,
      message: "Error adding to wishlist",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// ==================== DEMO DATA SETUP ====================
const createDemoData = async () => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      logger.info('🔄 Setting up demo data...');

      // Demo Users
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        const demoUsers = [
          {
            userType: 'admin',
            userFullName: 'Library Admin',
            employeeId: 'ADM001',
            mobileNumber: '9876543210',
            email: 'admin@library.com',
            password: 'admin123',
            department: 'Administration',
            isAdmin: true,
            isLibrarian: true,
            isActive: true
          },
          {
            userType: 'librarian',
            userFullName: 'Head Librarian',
            employeeId: 'LIB001',
            mobileNumber: '9876543211',
            email: 'librarian@library.com',
            password: 'lib123',
            department: 'Library',
            isLibrarian: true,
            isActive: true
          },
          {
            userType: 'student',
            userFullName: 'Demo Student',
            admissionId: 'STU2024001',
            mobileNumber: '9876543212',
            email: 'student@college.com',
            password: 'student123',
            department: 'Computer Engineering',
            course: 'B.Tech',
            semester: 3,
            isActive: true
          }
        ];
        
        for (const userData of demoUsers) {
          const user = new User(userData);
          await user.save();
        }
        logger.info('✅ Demo users created');
      }

      // Demo Books
      const bookCount = await Book.countDocuments();
      if (bookCount === 0) {
        const demoBooks = [
          {
            isbn: "978-3-16-148410-0",
            bookName: "Wings of Fire",
            author: "A.P.J. Abdul Kalam",
            bookCountAvailable: 3,
            totalCopies: 5,
            categories: ["Biography", "Inspirational"],
            description: "An autobiography of A.P.J. Abdul Kalam, former President of India.",
            publicationYear: 1999,
            publisher: "Universities Press",
            rating: { average: 4.8, count: 150 },
            popularity: 95,
            pages: 180,
            bookStatus: "Available"
          },
          {
            isbn: "978-0-06-231500-7",
            bookName: "The Alchemist",
            author: "Paulo Coelho",
            bookCountAvailable: 2,
            totalCopies: 4,
            categories: ["Fiction", "Philosophical"],
            description: "A mystical story of following your dreams.",
            publicationYear: 1988,
            publisher: "HarperOne",
            rating: { average: 4.7, count: 200 },
            popularity: 90,
            pages: 208,
            bookStatus: "Available"
          }
        ];
        
        for (const bookData of demoBooks) {
          const book = new Book(bookData);
          await book.save();
        }
        logger.info('✅ Demo books created');
      }

      // Demo Events
      const eventCount = await Event.countDocuments();
      if (eventCount === 0) {
        const demoEvents = [
          {
            title: "Book Reading Session",
            description: "Join us for a special book reading session of classic literature.",
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            location: "Main Library Hall",
            type: "Literary",
            participants: []
          }
        ];
        
        for (const eventData of demoEvents) {
          const event = new Event(eventData);
          await event.save();
        }
        logger.info('✅ Demo events created');
      }

      logger.info('✅ Demo data setup completed');
    } catch (error) {
      logger.error('❌ Error creating demo data:', error);
    }
  }
};

// ==================== ERROR HANDLING MIDDLEWARE ====================

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('🚨 Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`
    });
  }
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: messages
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS policy: Access denied'
    });
  }
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// ==================== SERVER STARTUP ====================
const PORT = process.env.PORT || 4000;

const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, async () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📚 Vadodara Central Library Management System`);
      logger.info(`📍 Location: Sayajigunj, Vadodara, Gujarat`);
      logger.info(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔌 WebSocket/Socket.io ready`);
      logger.info(`🏥 Health check: http://localhost:${PORT}/api/health`);
      
      if (process.env.NODE_ENV !== 'production') {
        await createDemoData();
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM signal received. Closing server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT signal received. Closing server...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();

module.exports = app;