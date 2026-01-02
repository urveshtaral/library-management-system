const multer = require('multer');
const path = require('path');

// File filter for images only
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = 'uploads/';
        
        // Determine upload directory based on field name
        if (file.fieldname === 'photo') {
            uploadPath += 'profiles/';
        } else if (file.fieldname === 'coverImage') {
            uploadPath += 'book-covers/';
        } else if (file.fieldname === 'image') {
            uploadPath += 'event-images/';
        } else {
            uploadPath += 'general/';
        }
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Error handling middleware
const handleUploadErrors = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
        }
    } else if (err) {
        return res.status(400).json({ message: err.message });
    }
    next();
};

module.exports = { upload, handleUploadErrors };