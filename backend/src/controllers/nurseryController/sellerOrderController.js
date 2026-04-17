const mongoose = require('mongoose');
const ordersModel = require('../../model/checkoutModel/orders');

// GET all orders for a seller's nursery
exports.getSellerOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const orderSearch = req.query.orderSearch && req.query.orderSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const statusFilter = req.query.status;

        const skipData = (page - 1) * limit;

        // Build search query
        let searchQuery = {
            "orderItems.nursery": req.nursery
        };

        if (orderSearch) {
            searchQuery.$or = [
                { _id: mongoose.isValidObjectId(orderSearch) ? orderSearch : null },
                { "orderItems.plantName": { $regex: new RegExp(orderSearch, 'i') } },
                { "orderItems.plant": mongoose.isValidObjectId(orderSearch) ? orderSearch : null },
            ];
        }

        if (statusFilter) {
            searchQuery["orderItems.orderStatus.status"] = statusFilter;
        }

        const total = await ordersModel.countDocuments(searchQuery);

        const result = await ordersModel.find(searchQuery)
            .limit(limit)
            .skip(skipData)
            .sort({ _id: -1 })
            .populate('user', 'firstName lastName email')
            .select('-payment.paymentId -delivery.delivery -shippingInfo.landmark');

        if (!result) {
            const error = new Error("Orders not found.");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Seller Orders retrieved successfully.",
            result,
            total,
            page,
            pages: Math.ceil(total / limit)
        };

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};

// GET single order detail for seller
exports.getSellerOrderById = async (req, res, next) => {
    try {
        const orderId = req.params.id;

        const result = await ordersModel.findOne({
            _id: orderId,
            "orderItems.nursery": req.nursery
        }).select('-payment.paymentId');

        if (!result) {
            const error = new Error("Order not found for your nursery.");
            error.statusCode = 404;
            throw error;
        }

        // Filter orderItems to show only items from this nursery
        const sellerOrderItems = result.orderItems.filter(item => 
            item.nursery.toString() === req.nursery.toString()
        );

        result.orderItems = sellerOrderItems;

        const info = {
            status: true,
            message: "Order details retrieved successfully.",
            result
        };

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};

// UPDATE order item status (seller updates status of their items)
exports.updateOrderItemStatus = async (req, res, next) => {
    try {
        const { orderId, itemIndex } = req.params;
        const { status, message } = req.body;

        if (!status) {
            const error = new Error("Status is required.");
            error.statusCode = 400;
            throw error;
        }

        const result = await ordersModel.findOne({
            _id: orderId,
            "orderItems.nursery": req.nursery
        });

        if (!result) {
            const error = new Error("Order not found for your nursery.");
            error.statusCode = 404;
            throw error;
        }

        // Map seller-visible index to the actual index in full orderItems array.
        const sellerItemIndexes = result.orderItems
            .map((item, idx) => ({ idx, nursery: item.nursery.toString() }))
            .filter((item) => item.nursery === req.nursery.toString())
            .map((item) => item.idx);

        const requestedSellerIndex = parseInt(itemIndex, 10);
        const targetIndex = sellerItemIndexes[requestedSellerIndex];

        if (targetIndex !== undefined && result.orderItems[targetIndex]) {
            result.orderItems[targetIndex].orderStatus = {
                status,
                message: message || `Order status updated to ${status}`,
                statusAt: new Date()
            };

            await result.save();

            const info = {
                status: true,
                message: "Order item status updated successfully.",
                result
            };

            res.status(200).send(info);
        } else {
            const error = new Error("Order item not found.");
            error.statusCode = 404;
            throw error;
        }

    } catch (error) {
        next(error);
    }
};

// GET seller order statistics
exports.getSellerOrderStats = async (req, res, next) => {
    try {
        const nurseryId = req.nursery;

        // Total orders
        const totalOrders = await ordersModel.countDocuments({
            "orderItems.nursery": nurseryId
        });

        // Pending orders
        const pendingOrders = await ordersModel.countDocuments({
            "orderItems.nursery": nurseryId,
            "orderItems.orderStatus.status": "Pending"
        });

        // Completed orders
        const completedOrders = await ordersModel.countDocuments({
            "orderItems.nursery": nurseryId,
            "orderItems.orderStatus.status": "Completed"
        });

        // Calculate total revenue
        const revenueData = await ordersModel.aggregate([
            {
                $match: {
                    "orderItems.nursery": mongoose.Types.ObjectId(nurseryId),
                    "payment.status": "paid"
                }
            },
            {
                $unwind: "$orderItems"
            },
            {
                $match: {
                    "orderItems.nursery": mongoose.Types.ObjectId(nurseryId)
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$orderItems.price" }
                }
            }
        ]);

        const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

        const info = {
            status: true,
            message: "Order statistics retrieved successfully.",
            result: {
                totalOrders,
                pendingOrders,
                completedOrders,
                totalRevenue
            }
        };

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};
