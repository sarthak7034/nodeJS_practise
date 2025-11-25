const { ObjectId } = require('mongodb');
const { getDb } = require('../config/db');

const getUsers = async (req, res) => {
    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

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
};

const getUserById = async (req, res) => {
    try {
        const db = getDb();
        const usersCollection = db.collection('users');

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
