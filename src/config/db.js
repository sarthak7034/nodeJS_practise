const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

let db;

async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB!");
        db = client.db("taskManagerDB");
        
        // Optional: Seed data
        const usersCollection = db.collection("users");
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

        return db;
    } catch (error) {
        console.error("❌ Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

function getDb() {
    if (!db) {
        throw new Error("Database not initialized");
    }
    return db;
}

module.exports = { connectDB, getDb };
