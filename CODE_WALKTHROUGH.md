# 🔍 Code Walkthrough: Real Request Example

Let's trace exactly what happens when you make this request:

```bash
curl http://localhost:3000/analytics/top-products?limit=3
```

---

## Step-by-Step Code Execution

### 1️⃣ **server.js** (Entry Point)

```javascript
// Line 22: Request arrives here
app.use('/analytics', analyticsRoutes);
```

**What happens**: Express matches `/analytics/*` and forwards to `analyticsRoutes`

---

### 2️⃣ **src/routes/analyticsRoutes.js**

```javascript
// Line 38-39: URL pattern matches
router.get('/top-products', analyticsController.getTopProducts);
```

**What happens**: 
- Route matches `/top-products`
- Calls `getTopProducts` function from controller
- Passes `req` (request object with `req.query.limit = 3`) and `res` (response object)

---

### 3️⃣ **src/controllers/analyticsController.js** (Line 52)

```javascript
const getTopProducts = async (req, res) => {
    try {
        // LINE 54: Extract query parameter
        const limit = parseInt(req.query.limit) || 10;
        // limit = 3

        // LINE 55: Build cache key
        const cacheKey = `analytics:top-products:${limit}`;
        // cacheKey = "analytics:top-products:3"
```

**What happens**: Function starts executing, extracts `limit=3` from URL

---

### 4️⃣ **Check Redis Cache**

```javascript
        // LINE 57-61: Try to get from cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('⚡ Cache Hit - Top Products');
            return res.json(JSON.parse(cached));
        }
        // If cached data exists, return immediately (fast path!)
```

**What happens**: 
- Checks if result for `limit=3` is already cached
- If YES (Cache Hit ⚡): Return cached data immediately, **function ends here**
- If NO (Cache Miss 🐢): Continue to database query

---

### 5️⃣ **Get Database Connection**

```javascript
        // LINE 63-64
        const db = getDb();
        const ordersCollection = db.collection('orders');
```

**What happens**: 
- Calls `getDb()` from `src/config/db.js`
- Gets reference to `orders` collection in MongoDB

---

### 6️⃣ **Build Aggregation Pipeline**

```javascript
        // LINE 67-109: Define the aggregation pipeline
        const pipeline = [
            // STAGE 1: Filter only delivered orders
            { $match: { status: 'delivered' } },
            
            // STAGE 2: Flatten items array
            // Before: { items: [{productId: 1}, {productId: 2}] }
            // After: Multiple docs → {productId: 1}, {productId: 2}
            { $unwind: '$items' },
            
            // STAGE 3: Group by product and calculate totals
            {
                $group: {
                    _id: '$items.productId',
                    totalQuantitySold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: '$items.subtotal' },
                    orderCount: { $sum: 1 }
                }
            },
            
            // STAGE 4: Sort by quantity (highest first)
            { $sort: { totalQuantitySold: -1 } },
            
            // STAGE 5: Limit to top 3
            { $limit: 3 },
            
            // STAGE 6: Join with products collection
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            
            // STAGE 7-8: Clean up and format
            { $unwind: '$product' },
            {
                $project: {
                    productId: '$product.productId',
                    productName: '$product.name',
                    category: '$product.category',
                    totalQuantitySold: 1,
                    totalRevenue: { $round: ['$totalRevenue', 2] },
                    orderCount: 1
                }
            }
        ];
```

**What happens**: Creates a complex multi-stage aggregation pipeline

---

### 7️⃣ **Execute Pipeline**

```javascript
        // LINE 111: Send pipeline to MongoDB
        const result = await ordersCollection.aggregate(pipeline).toArray();
```

**What happens**: 
- MongoDB processes 500 orders through the pipeline
- Returns top 3 best-selling products
- Example result:
```json
[
    {
        "productId": "PROD-0042",
        "productName": "Product 42",
        "category": "Electronics",
        "totalQuantitySold": 28,
        "totalRevenue": 3456.78,
        "orderCount": 15
    },
    // ... 2 more products
]
```

---

### 8️⃣ **Cache the Result**

```javascript
        // LINE 113: Store in Redis for 5 minutes (300 seconds)
        await redisClient.setEx(cacheKey, 300, JSON.stringify({ data: result }));
```

**What happens**: 
- Saves result to Redis
- Key: `"analytics:top-products:3"`
- Expires in 5 minutes
- Next request for `limit=3` will be cache hit!

---

### 9️⃣ **Send Response**

```javascript
        // LINE 115: Return to client
        res.json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
```

**What happens**: 
- Sends JSON response to client
- If any error occurred, sends 500 status with error message

---

## 🔄 Second Request (Cache Hit Path)

If you run the same command again within 5 minutes:

```bash
curl http://localhost:3000/analytics/top-products?limit=3
```

**Execution Path**:
1. server.js → analyticsRoutes → analyticsController
2. Check cache: `await redisClient.get('analytics:top-products:3')`
3. **Cache HIT!** ⚡
4. `return res.json(JSON.parse(cached))`
5. **Done!** (MongoDB never touched, 10x faster)

---

## 📊 Request Timeline Comparison

### Cache Miss (First Request):
```
0ms:   Request arrives
1ms:   Route matching
2ms:   Check Redis → MISS
5ms:   MongoDB aggregation pipeline
120ms: Pipeline complete
121ms: Cache result in Redis
122ms: Send response
```
**Total: ~122ms**

### Cache Hit (Second Request):
```
0ms:   Request arrives
1ms:   Route matching
2ms:   Check Redis → HIT
3ms:   Send response
```
**Total: ~3ms** (40x faster!)

---

## 🎯 Key Takeaways

1. **Middleware Chain**: Request passes through morgan → json parser → routes → controller
2. **Cache First**: Always check cache before expensive operations
3. **Async/Await**: Clean error handling with try-catch
4. **MongoDB Aggregation**: Powerful data processing in the database
5. **Separation of Concerns**: 
   - Routes define URLs
   - Controllers contain business logic
   - Config files handle connections

This is how professional Node.js applications are structured! 🚀
