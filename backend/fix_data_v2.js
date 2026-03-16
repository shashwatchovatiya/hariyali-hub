const mongoose = require('mongoose');
require('dotenv').config();

const DB = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plantdb";

const plantsSchema = new mongoose.Schema({
    plantName: String,
    images: [{
        public_id: String,
        url: String
    }],
    imagesList: [{
        public_id: String,
        url: String
    }]
}, { strict: false });

const Plant = mongoose.model('Plant_Fix', plantsSchema, 'plants');

async function fixData() {
    try {
        await mongoose.connect(DB);
        console.log("Connected to database for fixing...");

        const plants = await Plant.find({});
        console.log(`Found ${plants.length} plants.`);

        let fixedCount = 0;
        for (let plant of plants) {
            let updated = false;

            // Fix images
            if (!plant.images || plant.images.length === 0) {
                plant.images = [{
                    public_id: 'no-image-' + Date.now(),
                    url: 'https://via.placeholder.com/550x650.png?text=No+Image'
                }];
                updated = true;
            } else {
                for (let img of plant.images) {
                    if (!img.public_id || img.public_id === "") {
                        img.public_id = 'fixed-id-' + Math.random().toString(36).substring(7);
                        updated = true;
                    }
                    if (!img.url || img.url === "") {
                        img.url = 'https://via.placeholder.com/550x650.png?text=Fixed+Image';
                        updated = true;
                    }
                }
            }

            // Fix imagesList
            if (!plant.imagesList || plant.imagesList.length === 0) {
                plant.imagesList = plant.images;
                updated = true;
            }

            if (updated) {
                await Plant.updateOne({ _id: plant._id }, { 
                    $set: { 
                        images: plant.images, 
                        imagesList: plant.imagesList 
                    } 
                });
                fixedCount++;
            }
        }

        console.log(`Fixed ${fixedCount} plants.`);
        
        // Also check if any orders have broken image data
        const orderSchema = new mongoose.Schema({}, { strict: false });
        const Order = mongoose.model('Order_Fix', orderSchema, 'orders');
        const orders = await Order.find({});
        console.log(`Checking ${orders.length} orders...`);
        
        let fixedOrders = 0;
        for (let order of orders) {
            let orderUpdated = false;
            if (order.orderItems) {
                for (let item of order.orderItems) {
                    if (item.images && (!item.images.public_id || item.images.public_id === "")) {
                        item.images.public_id = 'fixed-order-id';
                        orderUpdated = true;
                    }
                }
            }
            if (orderUpdated) {
                await Order.updateOne({ _id: order._id }, { $set: { orderItems: order.orderItems } });
                fixedOrders++;
            }
        }
        console.log(`Fixed ${fixedOrders} orders.`);

        process.exit(0);
    } catch (error) {
        console.error("Error fixing data:", error);
        process.exit(1);
    }
}

fixData();
