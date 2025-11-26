# MongoDB Aggregation Pipeline Examples

This document explains the advanced MongoDB aggregation pipelines implemented in this project.

## Overview

Aggregation pipelines process data records and return computed results. They're similar to SQL GROUP BY operations but much more powerful.

## 1. Daily Sales Analytics

**Endpoint**: `GET /analytics/sales`

**Business Use**: Track daily revenue performance over the last 30 days.

**Pipeline Stages**:
```javascript
[
    // Stage 1: Filter delivered orders from last 30 days
    {
        $match: {
            status: 'delivered',
            orderDate: { $gte: thirtyDaysAgo }
        }
    },
    
    // Stage 2: Group by date and calculate metrics
    {
        $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' }},
            totalRevenue: { $sum: '$totalAmount' },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' }
        }
    },
    
    // Stage 3: Sort by date
    { $sort: { _id: 1 } }
]
```

**Key Operators**:
- `$match`: Filters documents (like SQL WHERE)
- `$group`: Groups documents by a key (like SQL GROUP BY)
- `$dateToString`: Formats dates
- `$sum`, `$avg`: Aggregation operators

---

## 2. Top Selling Products

**Endpoint**: `GET /analytics/top-products?limit=10`

**Business Use**: Identify best-selling products for inventory and marketing decisions.

**Pipeline Stages**:
```javascript
[
    { $match: { status: 'delivered' } },
    
    // Flatten the items array
    { $unwind: '$items' },
    
    // Group by product
    {
        $group: {
            _id: '$items.productId',
            totalQuantitySold: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
            orderCount: { $sum: 1 }
        }
    },
    
    { $sort: { totalQuantitySold: -1 } },
    { $limit: 10 },
    
    // Join with products collection
    {
        $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
        }
    }
]
```

**Key Operators**:
- `$unwind`: Deconstructs array field into multiple documents
- `$lookup`: Performs left outer join (like SQL JOIN)
- `$limit`: Restricts number of results

---

## 3. Category Revenue Breakdown

**Endpoint**: `GET /analytics/categories`

**Business Use**: Understand which product categories drive the most revenue.

**Pipeline Features**:
- Multi-collection join (`$lookup`)
- Nested document processing
- Revenue aggregation by category

**Key Insight**: Combines orders → products to analyze categories.

---

## 4. Customer Lifetime Value (CLV)

**Endpoint**: `GET /analytics/user-patterns`

**Business Use**: Identify high-value customers for retention strategies.

**Pipeline Stages**:
```javascript
[
    { $match: { status: 'delivered' } },
    
    {
        $group: {
            _id: '$userId',
            totalOrders: { $sum: 1 },
            totalSpent: { $sum: '$totalAmount' },
            avgOrderValue: { $avg: '$totalAmount' },
            firstOrder: { $min: '$orderDate' },
            lastOrder: { $max: '$orderDate' }
        }
    },
    
    // Calculate derived fields
    {
        $addFields: {
            customerLifetimeValue: { $round: ['$totalSpent', 2] },
            daysBetweenOrders: {
                $divide: [
                    { $subtract: ['$lastOrder', '$firstOrder'] },
                    1000 * 60 * 60 * 24
                ]
            }
        }
    }
]
```

**Key Operators**:
- `$addFields`: Adds computed fields without changing existing structure
- `$subtract`, `$divide`: Math operations
- `$min`, `$max`: Find minimum/maximum values

---

## 5. Monthly Revenue Trends

**Endpoint**: `GET /analytics/monthly-revenue`

**Business Use**: Track business growth and seasonal patterns.

**Pipeline Features**:
```javascript
{
    $group: {
        _id: {
            year: { $year: '$orderDate' },
            month: { $month: '$orderDate' }
        },
        revenue: { $sum: '$totalAmount' },
        orders: { $sum: 1 }
    }
}
```

**Key Operators**:
- `$year`, `$month`: Extract date components
- Compound grouping by multiple fields

---

## Performance Optimization

### Indexing Strategy
```javascript
// Recommended indexes:
db.orders.createIndex({ status: 1, orderDate: -1 })
db.orders.createIndex({ userId: 1 })
db.orders.createIndex({ 'items.productId': 1 })
```

### Caching
All aggregation results are cached in Redis with a 5-minute TTL to reduce database load.

---

## Data Model

### Orders Collection
```javascript
{
    orderId: "ORD-000001",
    userId: ObjectId("..."),
    items: [
        {
            productId: ObjectId("..."),
            quantity: 2,
            price: 99.99,
            subtotal: 199.98
        }
    ],
    totalAmount: 199.98,
    status: "delivered",
    orderDate: ISODate("...")
}
```

### Products Collection
```javascript
{
    productId: "PROD-0001",
    name: "Product 1",
    category: "Electronics",
    price: 99.99,
    stock: 150,
    rating: 4.5,
    reviews: 234
}
```

---

## Best Practices Demonstrated

1. **Pipeline Optimization**: Early `$match` to reduce data volume
2. **Proper Joins**: `$lookup` for normalized data
3. **Calculated Fields**: Using `$addFields` for derived metrics
4. **Result Formatting**: `$project` for clean API responses
5. **Index Usage**: Queries designed to leverage indexes
6. **Caching**: Redis layer for frequently accessed analytics

---

## Industry Applications

These patterns are used in:
- **E-commerce**: Sales dashboards, product analytics
- **SaaS**: User engagement metrics, churn analysis
- **Finance**: Transaction reporting, fraud detection
- **Healthcare**: Patient analytics, resource utilization
- **Logistics**: Delivery performance, route optimization
