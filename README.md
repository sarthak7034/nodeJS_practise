## 🚀 Features

- **Express Server**: Fast and minimalist web framework.
- **MongoDB Integration**: Real database persistence using the official MongoDB driver.
- **Redis Caching**: Lightning-fast response times with intelligent caching strategy.
- **CRUD Operations**: Create, Read, Update, and Delete users.
- **Pagination**: Efficient offset-based pagination for fetching large datasets.
- **Swagger Documentation**: Interactive API docs at `/api-docs`.
- **Logging**: Request logging using `morgan`.
- **Auto-Seeding**: Automatically populates the database with mock data if empty.
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

### Users

| Method | Endpoint | Description | Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/users` | Get all users (Paginated) | `/users?page=1&limit=10` |
| `GET` | `/users/:id` | Get a single user by ID | `/users/656...` |
| `POST` | `/users` | Create a new user | Body: `{ "name": "John", "email": "john@test.com" }` |
| `PUT` | `/users/:id` | Update a user | Body: `{ "role": "admin" }` |
| `DELETE` | `/users/:id` | Delete a user | - |

## 📂 Project Structure

```
.
├── src/
│   ├── config/
│   │   ├── db.js           # MongoDB connection
│   │   ├── redis.js        # Redis connection
│   │   └── swagger.js      # Swagger configuration
│   ├── controllers/
│   │   └── userController.js  # User business logic
│   └── routes/
│       └── userRoutes.js   # User API routes
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
