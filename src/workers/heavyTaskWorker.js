const { parentPort, workerData } = require('worker_threads');

// Simulate a CPU-intensive task (e.g., calculating primes up to a large number)
function calculatePrimes(limit) {
    const primes = [];
    for (let i = 2; i <= limit; i++) {
        let isPrime = true;
        for (let j = 2; j <= Math.sqrt(i); j++) {
            if (i % j === 0) {
                isPrime = false;
                break;
            }
        }
        if (isPrime) {
            primes.push(i);
        }
    }
    return primes;
}

// Main execution block for the worker
try {
    const start = Date.now();
    console.log(`[Worker] Starting heavy computation for limit: ${workerData.limit}`);
    
    const result = calculatePrimes(workerData.limit);
    
    const end = Date.now();
    const duration = end - start;
    
    console.log(`[Worker] Finished in ${duration}ms. Found ${result.length} primes.`);
    
    // Send result back to main thread
    parentPort.postMessage({
        status: 'success',
        data: {
            count: result.length,
            duration: duration,
            primes: result // Sending potentially large data
        }
    });
} catch (error) {
    parentPort.postMessage({
        status: 'error',
        error: error.message
    });
}
