# Application Workflow: File-to-File Interactions

This document explains the complete workflow of the application, from startup to request handling.

---

## 🚀 Part 1: Server Startup Flow

```
1. npm run dev
   └─> Executes: nodemon server.js

2. server.js (Main Entry Point)
   ├─> Line 1-7: Import all dependencies
   │   ├── express
   │   ├── morgan (logger)
   │   ├── swagger-ui-express
   │   ├── ./src/config/db (Database connection)
   │   ├── ./src/routes/userRoutes
   │   ├── ./src/routes/analyticsRoutes
   │   └── ./src/config/swagger (API documentation)
   │
   ├─> Line 10-11: Initialize Express app
   │
   ├─> Line 14-15: Setup Middleware
   │   ├── morgan('dev') - Logs every HTTP request
   │   └── express.json() - Parses JSON request bodies
   │
   ├─> Line 18: Mount Swagger UI at /api-docs
   │
   ├─> Line 21-22: Register Route Handlers
   │   ├── /users → userRoutes
   │   └── /analytics → analyticsRoutes
   │
   └─> Line 27-34: startServer() function
       ├── Calls connectDB() from src/config/db.js
       ├── Calls connectRedis() from src/config/redis.js
       └── Starts listening on port 3000
```

---

## 🔌 Part 2: Database Connection (src/config/db.js)

```javascript
// FILE: src/config/db.js

connectDB() is called from server.js
│
├─> Line 8-11: Connect to MongoDB
│   └── mongodb://localhost:27017/taskManagerDB
│
├─> Line 14-24: Seed Users Collection
│   ├── Check if users collection is empty
│   ├── If empty, generate 50 mock users
│   └── Insert into database
│
└─> Line 26-27: Seed Products & Orders
    └── Calls seedDatabase(db) → src/config/seedData.js
```

### Data Seeding Flow (src/config/seedData.js)

```javascript
// FILE: src/config/seedData.js

seedDatabase(db) receives db instance
│
├─> Line 66-81: Seed Products
│   ├── Check if products collection is empty
│   ├── generateProducts() creates 100 products
│   └── Insert into database
│
└─> Line 84-104: Seed Orders
    ├── Check if orders collection is empty
    ├── Fetch existing userIds from database
    ├── Fetch existing productIds from database
    ├── generateOrders(userIds, productIds) creates 500 orders
    └── Insert into database
```

---

## ⚡ Part 3: Redis Connection (src/config/redis.js)

```javascript
// FILE: src/config/redis.js

connectRedis() is called from server.js
│
├─> Line 3-5: Create Redis client
│   └── redis://localhost:6379
│
├─> Line 7-8: Setup error & connection event handlers
│
└─> Line 11: Connect to Redis
```

---

## 📡 Part 4: HTTP Request Flow (Example: GET /users)

### Step-by-Step Journey of a Request:

```
1. Browser/Postman → GET http://localhost:3000/users?page=1&limit=10
   │
   ├─> server.js (Line 14) - morgan middleware logs the request
   ├─> server.js (Line 15) - express.json() parses body (not needed for GET)
   │
   └─> server.js (Line 21) - Routes to userRoutes
       │
       └─> src/routes/userRoutes.js
           │
           ├─> Line 63: Matches GET /users
           │   └── router.get('/', userController.getUsers)
           │
           └─> Calls getUsers() in src/controllers/userController.js
               │
               └─> src/controllers/userController.js
                   │
                   ├─> Line 5: Function getUsers(req, res)
                   │
                   ├─> Line 7-9: Extract pagination parameters
                   │   ├── page = req.query.page || 1
                   │   └── limit = req.query.limit || 10
                   │
                   ├─> Line 12: Build cache key: "users:1:10"
                   │
                   ├─> Line 15-18: CHECK REDIS CACHE
                   │   ├── redisClient.get(cacheKey)
                   │   ├── If found → Return cached data (⚡ Fast!)
                   │   └── If not found → Continue to database
                   │
                   ├─> Line 21-22: GET DATABASE CONNECTION
                   │   └── getDb() from src/config/db.js
                   │
                   ├─> Line 25-28: QUERY MONGODB
                   │   ├── usersCollection.find().skip(skip).limit(limit)
                   │   └── Count total documents (for pagination meta)
                   │
                   ├─> Line 30-37: BUILD RESPONSE
                   │   ├── meta: { total_items, current_page, etc. }
                   │   └── data: [users array]
                   │
                   ├─> Line 40: CACHE THE RESULT in Redis (60 seconds)
                   │   └── redisClient.setEx(cacheKey, 60, JSON.stringify(response))
                   │
                   └─> Line 42: SEND RESPONSE to client
                       └── res.json(response)
```

---

## 📊 Part 5: Aggregation Request Flow (Example: GET /analytics/top-products)

```
1. Client → GET http://localhost:3000/analytics/top-products?limit=5
   │
   └─> server.js (Line 22) → Routes to analyticsRoutes
       │
       └─> src/routes/analyticsRoutes.js
           │
           ├─> Line 38: Matches GET /top-products
           │   └── router.get('/top-products', analyticsController.getTopProducts)
           │
           └─> Calls getTopProducts() in src/controllers/analyticsController.js
               │
               └─> src/controllers/analyticsController.js
                   │
                   ├─> Line 52: Function getTopProducts(req, res)
                   │
                   ├─> Line 54: Extract limit parameter
                   │
                   ├─> Line 57-61: CHECK REDIS CACHE
                   │   └── cacheKey = "analytics:top-products:5"
                   │
                   ├─> Line 66: Get database connection
                   │
                   ├─> Line 70-112: BUILD AGGREGATION PIPELINE
                   │   ├── Stage 1: $match - Filter delivered orders
                   │   ├── Stage 2: $unwind - Flatten items array
                   │   ├── Stage 3: $group - Sum quantities by product
                   │   ├── Stage 4: $sort - Order by quantity sold
                   │   ├── Stage 5: $limit - Top 5 products
                   │   ├── Stage 6: $lookup - JOIN with products collection
                   │   ├── Stage 7: $unwind - Flatten product data
                   │   └── Stage 8: $project - Format output fields
                   │
                   ├─> Line 114: EXECUTE PIPELINE
                   │   └── ordersCollection.aggregate(pipeline).toArray()
                   │
                   ├─> Line 116: CACHE RESULT (5 minutes)
                   │
                   └─> Line 118: SEND RESPONSE
```

---

## 🔄 Part 6: Data Mutation Flow (Example: POST /users)

```
1. Client → POST http://localhost:3000/users
   Body: { "name": "John", "email": "john@test.com" }
   │
   └─> server.js
       ├─> morgan logs request
       ├─> express.json() PARSES BODY into req.body
       │
       └─> userRoutes → userController.createUser()
           │
           ├─> Line 79-82: Extract data from req.body
           │   └── const { name, email, role } = req.body
           │
           ├─> Line 84-86: VALIDATE required fields
           │   └── If missing, return 400 error
           │
           ├─> Line 88-93: CREATE user object
           │   └── Add createdAt timestamp
           │
           ├─> Line 95: INSERT into MongoDB
           │   └── usersCollection.insertOne(newUser)
           │
           ├─> Line 97-100: RETURN success response
           │   └── Status 201 (Created)
           │
           └─> NOTE: Cache invalidation
               └── Lists aren't invalidated (rely on 60s TTL)
```

---

## 🔄 Part 7: Cache Invalidation Flow (Example: PUT /users/:id)

```
1. Client → PUT http://localhost:3000/users/65abc123...
   │
   └─> userController.updateUser()
       │
       ├─> Line 121: Validate ObjectId format
       │
       ├─> Line 126-129: UPDATE in MongoDB
       │   └── usersCollection.updateOne({ _id }, { $set: {...} })
       │
       ├─> Line 136: INVALIDATE specific user cache
       │   └── redisClient.del(`user:65abc123...`)
       │       └── Next GET for this user will be cache miss
       │
       └─> Line 138: Return success
```

---

## 🧵 Part 8: Queue & Worker Flow (RabbitMQ version)

```
1. Client → GET http://localhost:3000/analytics/heavy-task?limit=1000000
   │
   └─> analyticsRoutes → analyticsController.getHeavyComputation()
       │
       ├─> Line 333: Call addJob()
       │   └── src/config/queue.js
       │
       ├─> Inside addJob():
       │   ├── Generate UUID
       │   ├── Save status to Redis: SET job:<uuid> { state: 'active' }
       │   └── Send msg to RabbitMQ: "heavy-computation" queue
       │
       └─> Line 338: Return Job ID immediately (Non-blocking)
           └── res.json({ jobId, status: 'started' })

2. BACKGROUND PROCESSING (src/config/queue.js)
   │
   └─> startWorker() (Listening to RabbitMQ)
       │
       ├─> Message Received! 📨
       │
       ├─> Line 67: Spawn Worker Thread
       │   └── new Worker('./workers/heavyTaskWorker.js')
       │
       ├─> Worker Thread (Parallel CPU Core)
       │   └── Calculates Primes 🔢
       │
       └─> Worker Finishes
           ├── Update Redis: SET job:<uuid> { state: 'completed', result }
           └── ACK RabbitMQ: Delete message from queue

3. Client → GET http://localhost:3000/analytics/task-status/1
   │
   └─> analyticsController.getTaskStatus()
       │
       └─> READ Redis: GET job:<uuid>
           │
           ├─> If state="active" → Return "Processing..."
           └─> If state="completed" → Return Result
```

---

## 🗂️ Complete File Dependency Tree

```
server.js (Root)
├── src/config/db.js
│   ├── mongodb (npm package)
│   └── src/config/seedData.js
│       └── (generates mock data, no dependencies)
│
├── src/config/redis.js
│   └── redis (npm package)
│
├── src/config/queue.js
│   ├── amqplib (RabbitMQ client)
│   ├── uuid (Job ID generation)
│   ├── redisClient (State management)
│   └── src/workers/heavyTaskWorker.js (Worker Thread)
│
├── src/config/swagger.js
│   ├── swagger-jsdoc (npm package)
│   └── reads JSDoc from src/routes/*.js
│
├── src/routes/userRoutes.js
│   ├── express.Router()
│   └── src/controllers/userController.js
│       ├── src/config/db.js → getDb()
│       └── src/config/redis.js → client
│
└── src/routes/analyticsRoutes.js
    ├── express.Router()
    └── src/controllers/analyticsController.js
        ├── src/config/db.js → getDb()
        ├── src/config/redis.js → client
        └── src/config/queue.js → heavyTaskQueue
```

---

## 🎯 Key Design Patterns Used

### 1. **MVC Pattern (Sort of)**
```
Routes (src/routes/) → Define URL endpoints
Controllers (src/controllers/) → Business logic
Models → Implicit (MongoDB collections)
```

### 2. **Singleton Pattern**
```javascript
// db.js exports a single db instance
let db; // Shared across all requests
```

### 3. **Middleware Chain**
```javascript
Request → morgan → express.json() → router → controller → response
```

### 4. **Dependency Injection**
```javascript
// db.js doesn't import seedData
// server.js coordinates both
connectDB() → seedDatabase(db) // Passes db instance
```

### 5. **Caching Strategy**
```
Read: Check Cache → Cache Miss → Database → Cache Result → Respond
Write: Update Database → Invalidate Cache
```

### 6. **Job Queue Pattern**
```
Client Request → Add to Queue → Return ID
Background Worker → Process Job → Store Result
Client Polls → Get Result
```

---

## 📝 Summary: How It All Works

1. **Startup**: server.js orchestrates connections (MongoDB, Redis)
2. **Data Seeding**: Automated on first run (users, products, orders)
3. **Request Routing**: Express matches URL → routes → controller
4. **Cache Layer**: Redis stores frequent queries for speed
5. **Database**: MongoDB stores persistent data
6. **Aggregations**: Complex pipeline queries for analytics
7. **Job Queue**: Bull queue manages background jobs
8. **Multi-threading**: Worker threads execute heavy tasks off-main-thread
9. **Response**: JSON data sent back to client

**Flow Diagram (High Level)**:
```
Client Request
    ↓
Morgan Logger
    ↓
JSON Parser
    ↓
Route Matcher (userRoutes/analyticsRoutes)
    ↓
Controller (userController/analyticsController)
    ↓
Redis Cache Check
    ↓ (cache miss)
MongoDB Query OR Add to Queue (Async)
    ↓
Cache Result / Return Job ID
    ↓
JSON Response → Client
```


---

## 🏗️ Part 9: Deployment Workflow (Kubernetes)

This is how the application runs in a production-like environment (Kubernetes).

```
1. Build Process
   Dockerfile → docker build → Docker Image (node-app:latest)

2. Deployment (kubectl apply -f k8s/)
   │
   ├─> Database & Services Start First
   │   ├── MongoDB Pod (Port 27017)
   │   ├── Redis Pod (Port 6379)
   │   └── RabbitMQ Pod (Ports 5672/15672)
   │
   └─> Application Starts (node-app Deployment)
       │
       ├─> Kubernetes injects Environment Variables
       │   ├── MONGO_URI from k8s Service DNS (mongodb)
       │   ├── REDIS_URL from k8s Service DNS (redis)
       │   └── RABBITMQ_URL from k8s Service DNS (rabbitmq)
       │
       └─> Application Connects
           ├── Connects to mongodb:27017
           ├── Connects to redis:6379
           └── Connects to rabbitmq:5672

3. Traffic Flow
   User (localhost:3000)
    ↓
   Kubernetes Service (LoadBalancer/NodePort)
    ↓
   Node App Pod
    ↓
   Internal Cluster DNS (e.g., "mongodb")
    ↓
   Database Pod
```

This architecture allows the application to be scalable, self-healing, and easily managed.

