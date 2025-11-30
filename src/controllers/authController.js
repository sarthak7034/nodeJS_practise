const { getDb } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET, ACCESS_TOKEN_EXPIRY, REFRESH_TOKEN_EXPIRY } = require('../config/secrets');
const { ObjectId } = require('mongodb');

// Helper: Generate Token Pair
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user._id, email: user.email, role: user.role || 'user' },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { userId: user._id },
        REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    return { accessToken, refreshToken };
};

// 1. Register User
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: "Name, email, and password are required" });
        }

        const db = getDb();
        const usersCollection = db.collection('users');

        // Check if user exists
        const existingUser = await usersCollection.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: role || 'user',
            refreshTokens: [], // Array to store valid refresh tokens (for multi-device support)
            createdAt: new Date()
        };

        const result = await usersCollection.insertOne(newUser);
        
        // Issue tokens immediately? Or force login? Let's force login for security.
        res.status(201).json({ 
            message: "User registered successfully", 
            userId: result.insertedId 
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const db = getDb();
        const usersCollection = db.collection('users');
        
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate Tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save Refresh Token to DB (Rotation Strategy)
        // We store the token (or a hash of it) to verify it later.
        // For simplicity, we store the token string, but in high-security, store a hash.
        await usersCollection.updateOne(
            { _id: user._id },
            { $push: { refreshTokens: refreshToken } }
        );

        res.json({ accessToken, refreshToken });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Refresh Token (With Rotation & Reuse Detection)
const refreshToken = async (req, res) => {
    const incomingRefreshToken = req.body.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json({ error: "Refresh Token required" });
    }

    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        // Verify the token signature first
        const decoded = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);
        
        // Find user
        const user = await usersCollection.findOne({ _id: new ObjectId(decoded.userId) });
        if (!user) return res.status(403).json({ error: "User not found" });

        // Check if token is in the valid list
        const tokenIndex = user.refreshTokens.indexOf(incomingRefreshToken);

        if (tokenIndex === -1) {
            // 🚨 REUSE DETECTED! 
            // The token is valid (signature wise) but not in DB. 
            // It means it was already used/rotated. Possible theft!
            console.warn(`[Security] Refresh Token Reuse Detected for user: ${user.email}`);
            
            // Nuclear Option: Invalidate ALL refresh tokens for this user
            await usersCollection.updateOne(
                { _id: user._id },
                { $set: { refreshTokens: [] } }
            );

            return res.status(403).json({ error: "Security Alert: Token reuse detected. Please login again." });
        }

        // ✅ Normal Rotation
        // 1. Remove the used token
        // 2. Generate new pair
        // 3. Add new refresh token
        
        const newTokens = generateTokens(user);

        // Atomic update: Replace the old token with the new one
        await usersCollection.updateOne(
            { _id: user._id, refreshTokens: incomingRefreshToken },
            { 
                $set: { "refreshTokens.$": newTokens.refreshToken }
            }
        );

        res.json(newTokens);

    } catch (error) {
        console.error("Refresh Token Error:", error.message);
        return res.status(403).json({ 
            error: "Invalid Refresh Token", 
            details: error.message // Added for debugging
        });
    }
};

// 4. Logout
const logout = async (req, res) => {
    const incomingRefreshToken = req.body.refreshToken;
    if (!incomingRefreshToken) return res.sendStatus(204); // No content

    try {
        const db = getDb();
        const usersCollection = db.collection('users');

        // Remove the token from DB
        await usersCollection.updateOne(
            { refreshTokens: incomingRefreshToken },
            { $pull: { refreshTokens: incomingRefreshToken } }
        );

        res.sendStatus(204);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { register, login, refreshToken, logout };
