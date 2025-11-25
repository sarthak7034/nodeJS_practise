const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');
const { client: redisClient } = require('../config/redis');

const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        // Redis Key: users:page:limit
        const cacheKey = `users:${page}:${limit}`;

        // 1. Check Cache
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log('⚡ Cache Hit');
            return res.json(JSON.parse(cachedData));
        }

        console.log('🐢 Cache Miss - Fetching from DB');
        const db = getDb();
        const usersCollection = db.collection('users');

        const [users, totalItems] = await Promise.all([
            usersCollection.find().skip(skip).limit(limit).toArray(),
            usersCollection.countDocuments()
        ]);

        const response = {
            meta: {
                total_items: totalItems,
                current_page: page,
                items_per_page: limit,
                total_pages: Math.ceil(totalItems / limit)
            },
            data: users
        };

        // 2. Set Cache (Expire in 60 seconds)
        await redisClient.setEx(cacheKey, 60, JSON.stringify(response));

        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const userId = req.params.id;
        const cacheKey = `user:${userId}`;

        // 1. Check Cache
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
            console.log('⚡ Cache Hit');
            return res.json(JSON.parse(cachedUser));
        }

        const db = getDb();
        const usersCollection = db.collection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // 2. Set Cache (Expire in 60 seconds)
        await redisClient.setEx(cacheKey, 60, JSON.stringify({ data: user }));

        res.json({ data: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createUser = async (req, res) => {
    try {
        const db = getDb();
        const usersCollection = db.collection('users');

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
        
        // Invalidate List Cache (Simple approach: just let them expire or clear specific keys if known)
        // For now, we rely on TTL for lists, but we could clear specific patterns if needed.
        
        res.status(201).json({ 
            message: "User created successfully", 
            data: { ...newUser, _id: result.insertedId } 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const { name, email, role } = req.body;
        
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { name, email, role } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Invalidate Single User Cache
        await redisClient.del(`user:${req.params.id}`);

        res.json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        if (!ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid ID format" });
        }

        const result = await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "User not found" });
        }

        // Invalidate Single User Cache
        await redisClient.del(`user:${req.params.id}`);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};
