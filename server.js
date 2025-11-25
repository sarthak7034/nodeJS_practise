const express = require('express');
const morgan = require('morgan');
const swaggerUI = require('swagger-ui-express');
const { connectDB } = require('./src/config/db');
const userRoutes = require('./src/routes/userRoutes');
const swaggerSpecs = require('./src/config/swagger');

// 1. Initialize the Express Application
const app = express();
const PORT = 3000;

// 2. Middleware Setup
app.use(morgan('dev'));
app.use(express.json());

// 3. Swagger Documentation Route
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpecs));

// 4. API Routes
app.use('/users', userRoutes);

// 5. Start the Server (Only after DB connection)
const { connectRedis } = require('./src/config/redis');

async function startServer() {
    await connectDB();
    await connectRedis();
    
    app.listen(PORT, () => {
        console.log(`\n🚀 Server is running on http://localhost:${PORT}`);
        console.log(`📄 Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
}

startServer();
