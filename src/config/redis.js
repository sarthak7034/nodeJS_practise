const redis = require('redis');

const client = redis.createClient({
    url: 'redis://localhost:6379'
});

client.on('error', (err) => console.log('❌ Redis Client Error', err));
client.on('connect', () => console.log('✅ Connected to Redis!'));

async function connectRedis() {
    await client.connect();
}

module.exports = { client, connectRedis };
