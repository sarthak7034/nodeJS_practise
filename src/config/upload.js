const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDir = 'uploads';
const imagesDir = path.join(uploadDir, 'images');
const docsDir = path.join(uploadDir, 'docs');

[uploadDir, imagesDir, docsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Storage Engine (Local)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (file.fieldname === 'document') {
            cb(null, docsDir);
        } else {
            cb(null, imagesDir);
        }
    },
    filename: function (req, file, cb) {
        // Generate unique filename: fieldname-timestamp-random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File Filters
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const docFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents are allowed!'), false);
    }
};

// Limits
const limits = {
    fileSize: 5 * 1024 * 1024 // 5MB limit
};

// Exports
const uploadImage = multer({ 
    storage: storage,
    fileFilter: imageFilter,
    limits: limits
});

const uploadDoc = multer({ 
    storage: storage,
    fileFilter: docFilter,
    limits: limits
});

module.exports = { uploadImage, uploadDoc };
