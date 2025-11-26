// 1. Mock Product Data - E-commerce Inventory
const generateProducts = () => {
    const categories = [' Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports'];
    const products = [];
    
    for (let i = 1; i <= 100; i++) {
        products.push({
            productId: `PROD-${String(i).padStart(4, '0')}`,
            name: `Product ${i}`,
            category: categories[Math.floor(Math.random() * categories.length)],
            price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
            stock: Math.floor(Math.random() * 200),
            rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
            reviews: Math.floor(Math.random() * 1000),
            createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
        });
    }
    return products;
};

// 2. Mock Orders Data - Realistic Order Patterns
const generateOrders = (userIds, productIds) => {
    const orders = [];
    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    for (let i = 1; i <= 500; i++) {
        const orderDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Last 6 months
        const itemCount = Math.floor(Math.random() * 5) + 1; // 1-5 items per order
        const items = [];
        let totalAmount = 0;
        
        for (let j = 0; j < itemCount; j++) {
            const quantity = Math.floor(Math.random() * 3) + 1;
            const price = parseFloat((Math.random() * 200 + 10).toFixed(2));
            const subtotal = price * quantity;
            
            items.push({
                productId: productIds[Math.floor(Math.random() * productIds.length)],
                quantity,
                price,
                subtotal
            });
            
            totalAmount += subtotal;
        }
        
        orders.push({
            orderId: `ORD-${String(i).padStart(6, '0')}`,
            userId: userIds[Math.floor(Math.random() * userIds.length)],
            items,
            totalAmount: parseFloat(totalAmount.toFixed(2)),
            status: statuses[Math.floor(Math.random() * statuses.length)],
            orderDate,
            shippingAddress: {
                street: `${Math.floor(Math.random() * 9999)} Main St`,
                city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
                zipCode: String(Math.floor(Math.random() * 90000) + 10000)
            },
            createdAt: orderDate
        });
    }
    return orders;
};

// 3. Seed Function - Now accepts db as parameter
async function seedDatabase(db) {
    try {
        // Seed Products
        const productsCollection = db.collection('products');
        const productCount = await productsCollection.countDocuments();
        
        if (productCount === 0) {
            console.log('📦 Seeding products...');
            const products = generateProducts();
            await productsCollection.insertMany(products);
            console.log('✅ Products seeded!');
        }
        
        // Seed Orders (need user IDs first)
        const ordersCollection = db.collection('orders');
        const orderCount = await ordersCollection.countDocuments();
        
        if (orderCount === 0) {
            console.log('🛒 Seeding orders...');
            
            // Get existing user IDs
            const usersCollection = db.collection('users');
            const users = await usersCollection.find({}, { projection: { _id: 1 } }).toArray();
            const userIds = users.map(u => u._id);
            
            // Get product IDs
            const products = await productsCollection.find({}, { projection: { _id: 1 } }).toArray();
            const productIds = products.map(p => p._id);
            
            if (userIds.length > 0 && productIds.length > 0) {
                const orders = generateOrders(userIds, productIds);
                await ordersCollection.insertMany(orders);
                console.log('✅ Orders seeded!');
            }
        }
        
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

module.exports = { seedDatabase };

