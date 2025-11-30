const { MongoClient } = require('mongodb');

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function fixDatabase() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB");
        
        const db = client.db("taskManagerDB");
        const usersCollection = db.collection("users");

        // 1. Find users where refreshTokens is NOT an array
        // This includes users where it is missing, null, or a string
        const result = await usersCollection.updateMany(
            { 
                $or: [
                    { refreshTokens: { $exists: false } },
                    { refreshTokens: null },
                    { refreshTokens: { $type: "string" } } // In case a string was accidentally saved
                ]
            },
            { 
                $set: { refreshTokens: [] } // Reset to empty array
            }
        );

        console.log(`✅ Fixed ${result.modifiedCount} users. All users now have an array for refreshTokens.`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await client.close();
    }
}

fixDatabase();
