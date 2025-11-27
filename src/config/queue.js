const Queue = require('bull');
const path = require('path');
const { Worker } = require('worker_threads');

// 1. Create the Queue
const heavyTaskQueue = new Queue('heavy-computation', 'redis://localhost:6379');

// 2. Define the Processor (How to handle jobs)
heavyTaskQueue.process(async (job) => {
    return new Promise((resolve, reject) => {
        const { limit } = job.data;
        console.log(`[Queue] Processing job ${job.id} with limit: ${limit}`);

        // Path to the worker file
        const workerPath = path.resolve(__dirname, '../workers/heavyTaskWorker.js');
        
        // Spawn Worker
        const worker = new Worker(workerPath, {
            workerData: { limit }
        });

        worker.on('message', (result) => {
            if (result.status === 'success') {
                resolve(result.data);
            } else {
                reject(new Error(result.error));
            }
        });

        worker.on('error', (err) => reject(err));
        
        worker.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`Worker stopped with exit code ${code}`));
            }
        });
    });
});

// 3. Event Listeners
heavyTaskQueue.on('completed', (job, result) => {
    console.log(`[Queue] Job ${job.id} completed! Found ${result.count} primes.`);
});

heavyTaskQueue.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job.id} failed: ${err.message}`);
});

module.exports = { heavyTaskQueue };
