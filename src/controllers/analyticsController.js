const { getDb } = require('../config/db');
const { client: redisClient } = require('../config/redis');

// 1. Sales Analytics - Revenue by Date Range
const getSalesAnalytics = async (req, res) => {
    try {
        const cacheKey = 'analytics:sales';
        
        // Check cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache Hit - Sales Analytics');
            return res.json(JSON.parse(cached));
        }
        
        const db = getDb();
        const ordersCollection = db.collection('orders');
        
        // Aggregation Pipeline: Daily sales summary for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const pipeline = [
            // 1. Filter: Only delivered orders from last 30 days
            {
                $match: {
                    status: 'delivered',
                    orderDate: { $gte: thirtyDaysAgo }
                }
            },
            // 2. Group: By date with revenue and count
            {
                $group: {
                    _id: { 
                        $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }
                    },
                    totalRevenue: { $sum: '$totalAmount' },
                    orderCount: { $sum: 1 },
                    avgOrderValue: { $avg: '$totalAmount' }
                }
            },
            // 3. Sort: By date ascending
            { $sort: { _id: 1 } },
            // 4. Project: Format output
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    orderCount: 1,
                    avgOrderValue: { $round: ['$avgOrderValue', 2] }
                }
            }
        ];
        
        const result = await ordersCollection.aggregate(pipeline).toArray();
        
        // Cache for 5 minutes
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ data: result }));
        
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Top Products - Best Sellers
const getTopProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const cacheKey = `analytics:top-products:${limit}`;
        
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache Hit - Top Products');
            return res.json(JSON.parse(cached));
        }
        
        const db = getDb();
        const ordersCollection = db.collection('orders');
        
        // Aggregation Pipeline: Top selling products
        const pipeline = [
            // 1. Filter: Only delivered orders
            { $match: { status: 'delivered' } },
            // 2. Unwind: Flatten items array
            { $unwind: '$items' },
            // 3. Group: By product ID
            {
                $group: {
                    _id: '$items.productId',
                    totalQuantitySold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    orderCount: { $sum: 1 }
                }
            },
            // 4. Sort: By quantity sold
            { $sort: { totalQuantitySold: -1 } },
            // 5. Limit: Top N products
            { $limit: limit },
            // 6. Lookup: Join with products collection
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            // 7. Unwind: Flatten product
            { $unwind: '$product' },
            // 8. Project: Format output
            {
                $project: {
                    _id: 0,
                    productId: '$product.productId',
                    productName: '$product.name',
                    category: '$product.category',
                    totalQuantitySold: 1,
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    orderCount: 1
                }
            }
        ];
        
        const result = await ordersCollection.aggregate(pipeline).toArray();
        
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ data: result }));
        
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Category Revenue Breakdown
const getCategoryAnalytics = async (req, res) => {
    try {
        const cacheKey = 'analytics:categories';
        
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache Hit - Category Analytics');
            return res.json(JSON.parse(cached));
        }
        
        const db = getDb();
        const ordersCollection = db.collection('orders');
        
        // Complex Pipeline: Revenue by category
        const pipeline = [
            { $match: { status: 'delivered' } },
            { $unwind: '$items' },
            // Lookup products to get category
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: '$productInfo' },
            // Group by category
            {
                $group: {
                    _id: '$productInfo.category',
                    totalRevenue: { $sum: '$items.subtotal' },
                    totalItems: { $sum: '$items.quantity' },
                    avgPrice: { $avg: '$items.price' }
                }
            },
            // Sort by revenue
            { $sort: { totalRevenue: -1 } },
            // Format
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    totalItems: 1,
                    avgPrice: { $round: ['$avgPrice', 2] }
                }
            }
        ];
        
        const result = await ordersCollection.aggregate(pipeline).toArray();
        
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ data: result }));
        
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. User Purchase Patterns
const getUserPurchasePatterns = async (req, res) => {
    try {
        const cacheKey = 'analytics:user-patterns';
        
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache Hit - User Patterns');
            return res.json(JSON.parse(cached));
        }
        
        const db = getDb();
        const ordersCollection = db.collection('orders');
        
        // Pipeline: User spending analysis
        const pipeline = [
            { $match: { status: 'delivered' } },
            {
                $group: {
                    _id: '$userId',
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' },
                    avgOrderValue: { $avg: '$totalAmount' },
                    firstOrder: { $min: '$orderDate' },
                    lastOrder: { $max: '$orderDate' }
                }
            },
            // Add customer lifetime value
            {
                $addFields: {
                    customerLifetimeValue: { $round: ['$totalSpent', 2] },
                    daysBetweenOrders: {
                        $divide: [
                            { $subtract: ['$lastOrder', '$firstOrder'] },
                            1000 * 60 * 60 * 24 // Convert to days
                        ]
                    }
                }
            },
            // Sort by total spent
            { $sort: { totalSpent: -1 } },
            { $limit: 20 },
            // Lookup user info
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' },
            {
                $project: {
                    _id: 0,
                    userName: '$userInfo.name',
                    userEmail: '$userInfo.email',
                    totalOrders: 1,
                    totalSpent: { $round: ['$totalSpent', 2] },
                    avgOrderValue: { $round: ['$avgOrderValue', 2] },
                    customerLifetimeValue: 1,
                    daysBetweenOrders: { $round: ['$daysBetweenOrders', 0] }
                }
            }
        ];
        
        const result = await ordersCollection.aggregate(pipeline).toArray();
        
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ data: result }));
        
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. Monthly Revenue Trend
const getMonthlyRevenue = async (req, res) => {
    try {
        const cacheKey = 'analytics:monthly-revenue';
        
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache Hit - Monthly Revenue');
            return res.json(JSON.parse(cached));
        }
        
        const db = getDb();
        const ordersCollection = db.collection('orders');
        
        const pipeline = [
            { $match: { status: 'delivered' } },
            {
                $group: {
                    _id: {
                        year: { $year: '$orderDate' },
                        month: { $month: '$orderDate' }
                    },
                    revenue: { $sum: '$totalAmount' },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': -1, '_id.month': -1 } },
            { $limit: 12 },
            {
                $project: {
                    _id: 0,
                    year: '$_id.year',
                    month: '$_id.month',
                    revenue: { $round: ['$revenue', 2] },
                    orders: 1
                }
            }
        ];
        
        const result = await ordersCollection.aggregate(pipeline).toArray();
        
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ data: result }));
        
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { heavyTaskQueue } = require('../config/queue');

// ... existing imports ...

// 6. Heavy Computation (Queue + Worker Threads)
const getHeavyComputation = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100000;
        
        // Add job to the queue
        const job = await heavyTaskQueue.add({ limit });
        
        console.log(`[Main] Added job ${job.id} to queue`);

        // Respond immediately (Async processing)
        res.json({
            message: "Task added to queue",
            jobId: job.id,
            statusUrl: `/analytics/task-status/${job.id}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 7. Check Task Status
const getTaskStatus = async (req, res) => {
    try {
        const jobId = req.params.id;
        const job = await heavyTaskQueue.getJob(jobId);

        if (!job) {
            return res.status(404).json({ error: "Job not found" });
        }

        const state = await job.getState();
        const result = job.returnvalue;
        const reason = job.failedReason;

        res.json({
            jobId,
            state, // completed, failed, delayed, active, waiting
            result,
            error: reason
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSalesAnalytics,
    getTopProducts,
    getCategoryAnalytics,
    getUserPurchasePatterns,
    getMonthlyRevenue,
    getHeavyComputation,
    getTaskStatus
};
