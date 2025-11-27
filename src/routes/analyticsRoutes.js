const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * @swagger
 * tags:
 *   name: Analytics
 *   description: Business Intelligence & Aggregation Endpoints
 */

/**
 * @swagger
 * /analytics/sales:
 *   get:
 *     summary: Get daily sales analytics for last 30 days
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Daily revenue breakdown
 */
router.get('/sales', analyticsController.getSalesAnalytics);

/**
 * @swagger
 * /analytics/top-products:
 *   get:
 *     summary: Get top-selling products
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of top products to return (default 10)
 *     responses:
 *       200:
 *         description: List of best-selling products
 */
router.get('/top-products', analyticsController.getTopProducts);

/**
 * @swagger
 * /analytics/categories:
 *   get:
 *     summary: Get revenue breakdown by category
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Category-wise revenue analytics
 */
router.get('/categories', analyticsController.getCategoryAnalytics);

/**
 * @swagger
 * /analytics/user-patterns:
 *   get:
 *     summary: Get user purchase patterns and lifetime value
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Top customers by spending
 */
router.get('/user-patterns', analyticsController.getUserPurchasePatterns);

/**
 * @swagger
 * /analytics/monthly-revenue:
 *   get:
 *     summary: Get monthly revenue trends
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Last 12 months revenue data
 */
router.get('/monthly-revenue', analyticsController.getMonthlyRevenue);

/**
 * @swagger
 * /analytics/heavy-task:
 *   get:
 *     summary: Perform CPU-intensive task using Worker Threads
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Upper limit for prime calculation (default 100000)
 *     responses:
 *       200:
 *         description: Computation result
 */
router.get('/heavy-task', analyticsController.getHeavyComputation);

/**
 * @swagger
 * /analytics/task-status/{id}:
 *   get:
 *     summary: Check status of background job
 *     tags: [Analytics]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID returned from /heavy-task
 *     responses:
 *       200:
 *         description: Job status and result
 */
router.get('/task-status/:id', analyticsController.getTaskStatus);

module.exports = router;
