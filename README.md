## 🚀 Features

- **Express Server**: Fast and minimalist web framework.
- **MongoDB Integration**: Real database persistence using the official MongoDB driver.
- **Redis Caching**: Lightning-fast response times with intelligent caching strategy.
- **Advanced Aggregations**: Industry-standard MongoDB pipelines for business analytics.
- **Secure Authentication**: JWT-based auth with Refresh Token Rotation & Reuse Detection.
- **CRUD Operations**: Create, Read, Update, and Delete users.
- **Pagination**: Efficient offset-based pagination for fetching large datasets.
- **Swagger Documentation**: Interactive API docs at `/api-docs`.
- **Logging**: Request logging using `morgan`.
- **Auto-Seeding**: Populates database with realistic e-commerce data (users, products, orders).
- **Modular Architecture**: Clean separation of concerns (routes, controllers, config).

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Cache**: Redis
- **Documentation**: Swagger (OpenAPI 3.0)
- **Tools**: Nodemon (Dev), Morgan (Logger)

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone <repository-url>
    cd <repository-folder>
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start MongoDB**
    Ensure your MongoDB instance is running locally on port `27017`.
    ```bash
    # If using Docker
    docker run -d -p 27017:27017 --name mongodb mongo:latest
    ```

4.  **Start Redis**
    Ensure your Redis instance is running locally on port `6379`.
    ```bash
    # If using Docker
    docker run -d -p 6379:6379 --name redis redis:latest
    ```

5.  **Run the Application**
    ```bash
    # Development mode (Auto-restart)
    npm run dev

    # Production mode
    npm start
    ```

## 📡 API Endpoints

### Authentication (JWT + Refresh Token Rotation)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user | No |
| `POST` | `/auth/login` | Login & get tokens | No |
| `POST` | `/auth/refresh` | Rotate Refresh Token | No |
| `POST` | `/auth/logout` | Invalidate Refresh Token | No |

### Users

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Get all users (Paginated) | **Yes** |
| `GET` | `/users/:id` | Get a single user by ID | **Yes** |
| `POST` | `/users` | Create a new user (Admin) | **Yes (Admin)** |
| `PUT` | `/users/:id` | Update a user | **Yes** |
| `DELETE` | `/users/:id` | Delete a user (Admin) | **Yes (Admin)** |

### Analytics (MongoDB Aggregation Pipelines)

| Method | Endpoint | Description | Features |
| :--- | :--- | :--- | :--- |
| `GET` | `/analytics/sales` | Daily sales for last 30 days | `$match`, `$group`, `$dateToString` |
| `GET` | `/analytics/top-products` | Best-selling products | `$unwind`, `$lookup`, `$sort` |
| `GET` | `/analytics/categories` | Revenue by category | `$lookup`, `$group`, category breakdown |
| `GET` | `/analytics/user-patterns` | Customer Lifetime Value | `$addFields`, user spending analysis |
| `GET` | `/analytics/monthly-revenue` | Monthly trends | `$year`, `$month`, time-based grouping |
| `GET` | `/analytics/heavy-task` | Trigger CPU-intensive task | **Bull Queue** + **Worker Threads** |
| `GET` | `/analytics/task-status/:id` | Check background job status | Poll for async results |

## 📂 Project Structure

```
.
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── redis.js        # Redis connection
│   │   ├── queue.js        # Bull Queue config
│   │   ├── swagger.js      # Swagger configuration
│   │   └── seedData.js     # Mock data generation
│   ├── controllers/
│   │   ├── userController.js      # User business logic
│   │   └── analyticsController.js # Aggregation pipelines
│   ├── routes/
│   │   ├── userRoutes.js   # User API routes
│   │   └── analyticsRoutes.js # Analytics endpoints
│   └── workers/
│       └── heavyTaskWorker.js # Worker thread script
├── server.js               # Main application entry point
├── package.json            # Dependencies and scripts
├── .gitignore              # Ignored files
└── README.md               # Project documentation
```

## 📝 Changelog

- **v1.0.0**: Initial Release
    - Basic Express setup.
    - In-memory data storage.
- **v1.1.0**: MongoDB Migration
    - Replaced in-memory array with MongoDB.
    - Added `connectDB` function.
    - Implemented `users` collection with auto-seeding.
- **v1.2.0**: Project Restructuring & Swagger
    - Organized code into MVC pattern (Controllers, Routes, Config).
    - Added Swagger/OpenAPI documentation.
    - Improved code maintainability.
- **v1.3.0**: Redis Caching
    - Implemented Redis for response caching.
    - Added cache invalidation on updates/deletes.
    - Improved response times by ~8x on cached requests.
- **v1.4.0**: MongoDB Aggregation Pipelines
    - Added realistic e-commerce data (100 products, 500 orders).
    - Implemented 5 advanced aggregation endpoints:
      - Daily sales analytics (`$match`, `$group`, `$dateToString`)
      - Top products (`$unwind`, `$lookup`, `$sort`)
      - Category revenue (`$lookup`, multi-collection joins)
      - User purchase patterns (`$addFields`, customer LTV)
      - Monthly trends (time-based aggregations)
    - Industry-standard data modeling and query optimization.
- **v1.5.0**: Multi-threading & Job Queue
    - Implemented Worker Threads for CPU-intensive tasks (prime calculation).
    - Integrated Bull (Redis-backed queue) for background job processing.
    - Added job status tracking and result polling.
    - Queue concurrency set to 2 for optimal performance.
- **v1.6.0**: JWT Authentication & Authorization
    - Implemented secure JWT-based authentication system.
    - **Refresh Token Rotation**: Prevents stolen tokens from being reused.
    - **Reuse Detection**: Invalidates all tokens if theft is suspected.
    - Password hashing with `bcryptjs`.
    - Role-based authorization (Admin vs User).
    - Protected all user CRUD endpoints with authentication.
    - Microservices-ready architecture.
