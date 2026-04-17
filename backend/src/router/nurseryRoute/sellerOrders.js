const express = require('express');
const router = express.Router();

const auth = require('../../middleware/auth');
const { getSellerOrders, getSellerOrderById, updateOrderItemStatus, getSellerOrderStats } = require('../../controllers/nurseryController/sellerOrderController');

router.use(auth);

// GET all orders for seller's nursery
router.route('/orders')
    .get(getSellerOrders);

// GET seller order statistics/dashboard
router.route('/orders/stats')
    .get(getSellerOrderStats);

// GET single order detail for seller
router.route('/orders/:id')
    .get(getSellerOrderById);

// UPDATE order item status
router.route('/orders/:orderId/item/:itemIndex/status')
    .patch(updateOrderItemStatus);

module.exports = router;
