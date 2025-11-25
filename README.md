# Node.js Task Manager API

A robust RESTful API built with Node.js, Express, and MongoDB. This project serves as a learning journey from basic Node.js concepts to advanced backend development.

## 🚀 Features

- **Express Server**: Fast and minimalist web framework.
- **MongoDB Integration**: Real database persistence using the official MongoDB driver.
- **CRUD Operations**: Create, Read, Update, and Delete users.
- **Pagination**: Efficient offset-based pagination for fetching large datasets.
- **Logging**: Request logging using `morgan`.
- **Auto-Seeding**: Automatically populates the database with mock data if empty.

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
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

4.  **Run the Application**
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
├── server.js       # Main application entry point
├── package.json    # Dependencies and scripts
├── .gitignore      # Ignored files
└── README.md       # Project documentation
```

## 📝 Changelog

- **v1.0.0**: Initial Release
    - Basic Express setup.
    - In-memory data storage.
- **v1.1.0**: MongoDB Migration
    - Replaced in-memory array with MongoDB.
    - Added `connectDB` function.
    - Implemented `users` collection with auto-seeding.
