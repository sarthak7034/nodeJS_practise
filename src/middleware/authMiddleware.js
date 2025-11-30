const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../config/secrets');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    // Bearer <token>
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access Token Required" });
    }

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or Expired Token" });
        }
        
        // Attach user info to request
        req.user = user;
        next();
    });
};

// Optional: Role-based Authorization
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Access Denied: Insufficient Permissions" });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };
