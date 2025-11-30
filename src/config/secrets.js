// In a real app, use 'dotenv' to load these from a .env file
// require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    
    // JWT Secrets (Should be in .env in production)
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'development_access_secret_8923',
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'development_refresh_secret_4578',
    
    ACCESS_TOKEN_EXPIRY: '15m', // Short lived
    REFRESH_TOKEN_EXPIRY: '7d'  // Long lived
};
