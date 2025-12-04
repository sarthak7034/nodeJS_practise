const path = require('path');

const uploadFile = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Construct public URL
        // Assuming server is running on localhost:3000
        // In production, this base URL should be in env vars
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // Determine folder based on file type (logic matches config/upload.js)
        const folder = req.file.fieldname === 'document' ? 'docs' : 'images';
        
        const fileUrl = `${baseUrl}/uploads/${folder}/${req.file.filename}`;

        res.status(201).json({
            message: 'File uploaded successfully',
            file: {
                originalName: req.file.originalname,
                filename: req.file.filename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { uploadFile };
