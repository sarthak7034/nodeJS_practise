const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { Worker } = require('worker_threads');
const { client: redisClient } = require('./redis');

const QUEUE_NAME = 'heavy-computation';
let channel;

// 1. Connect to RabbitMQ (with Retry)
async function connectQueue(retries = 5) {
    while (retries) {
        try {
            const connection = await amqp.connect('amqp://localhost');
            channel = await connection.createChannel();
            await channel.assertQueue(QUEUE_NAME, { durable: true });
            
            // Set concurrency (prefetch) to 2
            channel.prefetch(2);
            
            console.log('✅ Connected to RabbitMQ!');
            
            // Start processing
            startWorker();
            return; // Success
            
        } catch (error) {
            console.error(`❌ RabbitMQ Connection Error (Retries left: ${retries - 1}):`, error.message);
            retries -= 1;
            if (retries === 0) break;
            // Wait 5 seconds before retrying
            await new Promise(res => setTimeout(res, 5000));
        }
    }
    console.error('❌ Could not connect to RabbitMQ after multiple attempts.');
}

// 2. Add Job (Producer)
async function addJob(data) {
    if (!channel) {
        console.warn('⚠️ RabbitMQ channel missing. Attempting to reconnect...');
        await connectQueue(1); // Try once
        if (!channel) throw new Error('RabbitMQ channel not initialized');
    }

    const jobId = uuidv4();
    const jobData = { jobId, ...data };

    // Store initial status in Redis (TTL: 1 hour)
    await redisClient.setEx(`job:${jobId}`, 3600, JSON.stringify({
        state: 'active', // Bull used 'active'/'waiting', we'll simplify
        submittedAt: new Date()
    }));

    // Send to RabbitMQ
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(jobData)), {
        persistent: true
    });

    console.log(`[Queue] Job ${jobId} added to RabbitMQ`);
    return { id: jobId };
}

// 3. Process Jobs (Consumer)
function startWorker() {
    console.log('[Queue] Waiting for messages...');
    
    channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;

        const jobData = JSON.parse(msg.content.toString());
        const { jobId, limit } = jobData;

        console.log(`[Queue] Processing job ${jobId} with limit: ${limit}`);

        // Path to the worker file
        const workerPath = path.resolve(__dirname, '../workers/heavyTaskWorker.js');

        // Spawn Worker Thread
        const worker = new Worker(workerPath, {
            workerData: { limit }
        });

        worker.on('message', async (result) => {
            if (result.status === 'success') {
                console.log(`[Queue] Job ${jobId} completed!`);
                
                // Update Redis with Result
                await redisClient.setEx(`job:${jobId}`, 3600, JSON.stringify({
                    state: 'completed',
                    result: result.data,
                    completedAt: new Date()
                }));

                // Acknowledge RabbitMQ (Remove from queue)
                channel.ack(msg);
            } else {
                // Handle failure
                await redisClient.setEx(`job:${jobId}`, 3600, JSON.stringify({
                    state: 'failed',
                    error: result.error
                }));
                channel.nack(msg, false, false); // Don't requeue if logic failed
            }
        });

        worker.on('error', async (err) => {
            console.error(`[Queue] Job ${jobId} failed:`, err);
            await redisClient.setEx(`job:${jobId}`, 3600, JSON.stringify({
                state: 'failed',
                error: err.message
            }));
            channel.nack(msg, false, false);
        });

        worker.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Worker stopped with exit code ${code}`);
            }
        });

    }, { noAck: false }); // Manual Ack
}

module.exports = { connectQueue, addJob };
