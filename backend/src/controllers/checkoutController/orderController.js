const mongoose = require('mongoose');
const ordersModel = require('../../model/checkoutModel/orders');
const cartModel = require('../../model/checkoutModel/cart');
const { deleteData } = require('../../utils/redisVercelKv'); 


exports.createOrder = async (req, res, next) => {
    try {
        console.log("[DEBUG] createOrder called with body:", JSON.stringify(req.body, null, 2));
        const newOrder = new ordersModel(req.body);
        console.log("[DEBUG] ordersModel instance created. Saving...");
        const result = await newOrder.save();
        console.log("[DEBUG] ordersModel save successful.");

        if (!result) {
            const error = new Error("Failed to create your new order.");
            error.statusCode = 400;
            throw error;
        }

        const total = await ordersModel.countDocuments({ user: req.user, orderAt: { $gte: Date.now() - (3 * 30 * 24 * 60 * 60 * 1000) } });

        const info = {
            status: true,
            message: "Successfully created your order.",
            result,
            total
        };

        res.status(200).send(info);
    } catch (error) {
        console.error("[DEBUG] createOrder error:", error);
        next(error);
    }
};


//? GET /api/products?page=1&limit=10
exports.getOrderHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const endDate = parseInt(req.query.endDate);
        const orderSearch = req.query.orderSearch && req.query.orderSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const skipData = (page - 1) * limit;

        const total = await ordersModel.countDocuments({
            user: req.user, orderAt: { $gte: endDate }, $or: [
                { _id: mongoose.isValidObjectId(orderSearch) ? orderSearch : null }, //? Search by order ID
                { "orderItems.plantName": { $regex: new RegExp(orderSearch, 'i') } }, //? Search by plant name (case-insensitive)
                { "orderItems.nurseryName": { $regex: new RegExp(orderSearch, 'i') } }, //? Search by plant name (case-insensitive)
                { "orderItems.plant": mongoose.isValidObjectId(orderSearch) ? orderSearch : null }, //? Search by plant name (case-insensitive)
                { "orderItems.nursery": mongoose.isValidObjectId(orderSearch) ? orderSearch : null }, //? Search by plant name (case-insensitive)
                { "payment.paymentMethods": { $regex: new RegExp(orderSearch, 'i') } },
            ]
        });

        const result = await ordersModel.find({
            user: req.user, orderAt: { $gte: endDate }, $or: [
                { _id: mongoose.isValidObjectId(orderSearch) ? orderSearch : null }, //? Search by order ID
                { "orderItems.plantName": { $regex: new RegExp(orderSearch, 'i') } }, //? Search by plant name (case-insensitive)
                { "orderItems.nurseryName": { $regex: new RegExp(orderSearch, 'i') } }, //? Search by plant name (case-insensitive)
                { "orderItems.plant": mongoose.isValidObjectId(orderSearch) ? orderSearch : null }, //? Search by plant name (case-insensitive)
                { "orderItems.nursery": mongoose.isValidObjectId(orderSearch) ? orderSearch : null }, //? Search by plant name (case-insensitive)
                { "payment.paymentMethods": { $regex: new RegExp(orderSearch, 'i') } },
            ]
        }).limit(limit).skip(skipData).select('-payment.paymentId -delivery -shippingInfo -pricing').sort({ _id: -1 });

        if (!result) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Your Order History.",
            result,
            total
        };

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};


exports.getOrderById = async (req, res, next) => {
    try {
        const _id = req.params.id;

        const result = await ordersModel.findOne({ _id, user: req.user }).select('-payment.paymentId -delivery');

        if (!result) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Your Order Details.",
            result
        };
        res.status(200).send(info);
    } catch (error) {
        next(error);
    }
};

//? This route is only accessible when payments are confirmed

exports.confirmOrderPayment = async (req, res, next) => {
    try {
        const { paymentId, status } = req.body;
        console.log(`[DEBUG] confirmOrderPayment called: paymentId=${paymentId}, status=${status}`);

        if (!paymentId || !status || status !== 'succeeded') {
            const error = new Error("You are not allowed to access this route.");
            error.statusCode = 403;
            throw error;
        }

        console.log(`[DEBUG] Updating order with paymentId=${paymentId}...`);
        const result = await ordersModel.findOneAndUpdate(
            { "payment.paymentId": paymentId, user: req.user },
            {
                $set: {
                    "payment.status": status,
                    "payment.message": "Payment Succeeded"
                }
            },
            {
                new: true
            }
        ).select('-payment.paymentId -delivery');

        if (!result) {
            console.error(`[DEBUG] Order with paymentId=${paymentId} NOT FOUND.`);
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }
        console.log(`[DEBUG] Order updated successfully: ${result._id}`);

        //* CLEANUP_TASK:: REMOVE ALL THE MATCHING THE CART DATA FROM THE DB 
        console.log(`[DEBUG] Cleaning up cart for ${result.orderItems.length} items...`);
        const deleteCartPromises = result.orderItems.map(async (items) => {
            const deleteCartInfo = await cartModel.findOneAndDelete(
                { plant: items.plant, user: req.user }
            );
            if (!deleteCartInfo) {
                console.warn(`[DEBUG] Cart for plant ${items.plant} not found during cleanup.`);
            } else {
                console.log(`[DEBUG] Cart item ${deleteCartInfo._id} deleted.`);
            }
        });

        await Promise.all(deleteCartPromises);
        console.log(`[DEBUG] Cart cleanup complete.`);

        //* CLEANUP_TASK:: REMOVE THE DATA FROM THE KV_DB OF THE ORDER_SESSION_DATA
        const keys = ['cartOrProducts', 'shipping', 'pricing', 'payment'];
        console.log(`[DEBUG] Cleaning up KV data: keys=${keys.join(', ')}`);
        
        const deleteKvPromises = keys.map(async (key) => {
            await deleteData(req.user, req.orderToken, key);
        });

        await Promise.all(deleteKvPromises);
        console.log(`[DEBUG] KV cleanup complete.`);

        const info = {
            status: true,
            message: "Payment Succeeded",
            result
        };
        res.status(200).send(info);
    } catch (error) {
        console.error("[DEBUG] confirmOrderPayment error:", error);
        next(error);
    }
};



exports.getLastOrder = async (req, res, next) => {
    try {
        const result = await ordersModel.find({ user: req.user }).sort({ _id: -1 }).limit(1).select('-payment.paymentId -delivery -shippingInfo -pricing');

        if (!result) {
            const error = new Error("Order not found.");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Your Last Order.",
            result
        };

        res.status(200).send(info);
    } catch (error) {
        next(error);
    }
}