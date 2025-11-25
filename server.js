const express = require('express');
const morgan = require('morgan');
const { MongoClient, ObjectId } = require('mongodb');

// 1. Initialize the Express Application
const app = express();
const PORT = 3000;

// 2. Middleware Setup
app.use(morgan('dev'));
app.use(express.json());

// 3. MongoDB Connection Setup
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
let db;
let usersCollection;

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB!");
        db = client.db("taskManagerDB"); // Database Name
        usersCollection = db.collection("users"); // Collection Name

        // Optional: Seed data if empty (so you have something to test)
        const count = await usersCollection.countDocuments();
        if (count === 0) {
            console.log("Seeding database with mock data...");
            const mockUsers = Array.from({ length: 50 }, (_, i) => ({
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                role: i % 3 === 0 ? 'admin' : 'user'
            }));
            await usersCollection.insertMany(mockUsers);
            console.log("✅ Database seeded!");
        }

    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1); // Exit if DB connection fails
    }
}

// ==========================================
// 4. API Routes (CRUD Operations with MongoDB)
// ==========================================

// 4.1 GET: Read All Users (with Offset Pagination)
app.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Fetch data and count total in parallel for performance
        const [users, totalItems] = await Promise.all([
            usersCollection.find().skip(skip).limit(limit).toArray(),
            usersCollection.countDocuments()
        ]);

        res.json({
            meta: {
                total_items: totalItems,
                current_page: page,
                items_per_page: limit,
                total_pages: Math.ceil(totalItems / limit)
            },
            data: users
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.2 GET: Read Single User by ID
app.get('/users/:id', async (req, res) => {
    try {
        // MongoDB uses ObjectId, not integers. We must convert the string ID.
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.3 POST: Create a New User
app.post('/users', async (req, res) => {
    try {
        const { name, email, role } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: "Name and Email are required" });
        }

        const newUser = {
            name,
            email,
            role: role || 'user',
            createdAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);
        
        // result.insertedId contains the new _id
        res.status(201).json({ 
            message: "User created successfully", 
            data: { ...newUser, _id: result.insertedId } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.4 PUT: Update a User
app.put('/users/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const { name, email, role } = req.body;
        
        // $set operator updates only specified fields
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { name, email, role } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4.5 DELETE: Remove a User
app.delete('/users/:id', async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Start the Server (Only after DB connection)
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
    });
});
