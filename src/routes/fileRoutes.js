const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { uploadImage, uploadDoc } = require('../config/upload');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: File Upload API
 */

/**
 * @swagger
 * /files/upload/image:
 *   post:
 *     summary: Upload an image
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
router.post('/upload/image', authenticateToken, uploadImage.single('image'), fileController.uploadFile);

/**
 * @swagger
 * /files/upload/doc:
 *   post:
 *     summary: Upload a document (PDF/Word)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file type or size
 */
router.post('/upload/doc', authenticateToken, uploadDoc.single('document'), fileController.uploadFile);

module.exports = router;
