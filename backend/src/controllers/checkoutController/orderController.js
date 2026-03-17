const { Op } = require('sequelize');
const { Order, OrderItem } = require('../../model/checkoutModel/orders');
const cartModel = require('../../model/checkoutModel/cart');
const { deleteData } = require('../../utils/redisVercelKv');

const isNumericId = (value) => Number.isInteger(Number(value));

const toLegacyOrderItem = (itemInstance) => {
    const item = itemInstance.toJSON ? itemInstance.toJSON() : itemInstance;

    return {
        _id: item.id,
        plant: item.plant_id,
        nursery: item.nursery_id,
        nurseryName: item.nurseryName,
        plantName: item.plantName,
        images: {
            public_id: item.image_public_id,
            url: item.image_url
        },
        price: Number(item.price),
        discount: Number(item.discount),
        quantity: item.quantity,
        orderStatus: item.orderStatus,
        orderStatusMessage: item.orderStatusMessage,
        statusAt: item.statusAt
    };
};

const toLegacyOrder = (orderInstance) => {
    const order = orderInstance.toJSON ? orderInstance.toJSON() : orderInstance;
    const orderItems = (order.orderItems || []).map(toLegacyOrderItem);

    return {
        _id: order.id,
        user: order.user_id,
        orderItems,
        shippingInfo: {
            name: order.shipping_name,
            phone: order.shipping_phone,
            pinCode: order.shipping_pinCode,
            address: order.shipping_address,
            landmark: order.shipping_landmark,
            city: order.shipping_city,
            state: order.shipping_state
        },
        pricing: {
            totalPriceWithoutDiscount: Number(order.totalPriceWithoutDiscount),
            actualPriceAfterDiscount: Number(order.actualPriceAfterDiscount),
            discountPrice: Number(order.discountPrice),
            deliveryPrice: Number(order.deliveryPrice),
            totalPrice: Number(order.totalPrice)
        },
        orderAt: order.orderAt,
        payment: {
            paymentId: order.paymentId,
            status: order.paymentStatus,
            message: order.paymentMessage,
            paymentMethods: order.paymentMethods
        },
        delivery: {
            delivery: order.delivery_id,
            deliveryPersonName: order.deliveryPersonName,
            deliveredAt: order.deliveredAt
        }
    };
};

exports.createOrder = async (req, res, next) => {
    try {
        const { orderItems = [], shippingInfo = {}, pricing = {}, payment = {} } = req.body;

        const createdOrder = await Order.create({
            user_id: req.user,
            shipping_name: shippingInfo.name,
            shipping_phone: shippingInfo.phone,
            shipping_pinCode: shippingInfo.pinCode,
            shipping_address: shippingInfo.address,
            shipping_landmark: shippingInfo.landmark || '',
            shipping_city: shippingInfo.city,
            shipping_state: shippingInfo.state,
            totalPriceWithoutDiscount: pricing.totalPriceWithoutDiscount,
            actualPriceAfterDiscount: pricing.actualPriceAfterDiscount,
            discountPrice: pricing.discountPrice,
            deliveryPrice: pricing.deliveryPrice,
            totalPrice: pricing.totalPrice,
            paymentId: payment.id,
            paymentStatus: payment.status || 'pending',
            paymentMessage: payment.message || 'Waiting for payment confirmation!',
            paymentMethods: Array.isArray(payment.payment_method_types)
                ? payment.payment_method_types.join(', ')
                : (payment.paymentMethods || 'card')
        });

        if (orderItems.length > 0) {
            await OrderItem.bulkCreate(orderItems.map((item) => ({
                order_id: createdOrder.id,
                plant_id: item.plant,
                nursery_id: item.nursery,
                nurseryName: item.nurseryName,
                plantName: item.plantName,
                image_public_id: item.images?.public_id || '',
                image_url: item.images?.url || '',
                price: item.price,
                discount: item.discount,
                quantity: item.quantity,
                orderStatus: item.orderStatus || 'pending',
                orderStatusMessage: item.orderStatusMessage || '',
                statusAt: item.statusAt || new Date()
            })));
        }

        const result = await Order.findByPk(createdOrder.id, { include: [{ model: OrderItem, as: 'orderItems' }] });

        if (!result) {
            const error = new Error('Failed to create your new order.');
            error.statusCode = 400;
            throw error;
        }

        const total = await Order.count({
            where: {
                user_id: req.user,
                orderAt: { [Op.gte]: new Date(Date.now() - (3 * 30 * 24 * 60 * 60 * 1000)) }
            }
        });

        res.status(200).send({
            status: true,
            message: 'Successfully created your order.',
            result: [toLegacyOrder(result)],
            total
        });
    } catch (error) {
        next(error);
    }
};

exports.getOrderHistory = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const endDate = parseInt(req.query.endDate, 10) || 0;
        const orderSearch = (req.query.orderSearch || '').trim();
        const skipData = (page - 1) * limit;

        const where = {
            user_id: req.user,
            orderAt: { [Op.gte]: new Date(endDate) }
        };

        if (orderSearch) {
            const likeTerm = `%${orderSearch}%`;
            where[Op.or] = [
                { paymentMethods: { [Op.like]: likeTerm } },
                ...(isNumericId(orderSearch) ? [{ id: Number(orderSearch) }] : [])
            ];
        }

        const include = [{
            model: OrderItem,
            as: 'orderItems',
            ...(orderSearch ? {
                required: false,
                where: {
                    [Op.or]: [
                        { plantName: { [Op.like]: `%${orderSearch}%` } },
                        { nurseryName: { [Op.like]: `%${orderSearch}%` } },
                        ...(isNumericId(orderSearch)
                            ? [{ plant_id: Number(orderSearch) }, { nursery_id: Number(orderSearch) }]
                            : [])
                    ]
                }
            } : {})
        }];

        const total = await Order.count({ where, distinct: true, col: 'id', include });

        const result = await Order.findAll({
            where,
            include,
            order: [['id', 'DESC']],
            limit,
            offset: skipData
        });

        const filteredResult = orderSearch
            ? result.filter((order) => {
                const orderJson = order.toJSON();
                const matchedByOrder = String(orderJson.id) === orderSearch || (orderJson.paymentMethods || '').toLowerCase().includes(orderSearch.toLowerCase());
                const matchedByItems = (orderJson.orderItems || []).length > 0;
                return matchedByOrder || matchedByItems;
            })
            : result;

        res.status(200).send({
            status: true,
            message: 'Your Order History.',
            result: filteredResult.map(toLegacyOrder),
            total
        });

    } catch (error) {
        next(error);
    }
};

exports.getOrderById = async (req, res, next) => {
    try {
        const result = await Order.findOne({
            where: { id: req.params.id, user_id: req.user },
            include: [{ model: OrderItem, as: 'orderItems' }]
        });

        if (!result) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        const legacyOrder = toLegacyOrder(result);
        delete legacyOrder.payment.paymentId;
        delete legacyOrder.delivery;

        res.status(200).send({
            status: true,
            message: 'Your Order Details.',
            result: legacyOrder
        });
    } catch (error) {
        next(error);
    }
};

exports.confirmOrderPayment = async (req, res, next) => {
    try {
        const { paymentId, status } = req.body;

        if (!paymentId || !status || status !== 'succeeded') {
            const error = new Error('You are not allowed to access this route.');
            error.statusCode = 403;
            throw error;
        }

        const result = await Order.findOne({
            where: { paymentId, user_id: req.user },
            include: [{ model: OrderItem, as: 'orderItems' }]
        });

        if (!result) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        await result.update({
            paymentStatus: status,
            paymentMessage: 'Payment Succeeded'
        });

        const refreshedResult = await Order.findByPk(result.id, {
            include: [{ model: OrderItem, as: 'orderItems' }]
        });

        const deleteCartPromises = (refreshedResult.orderItems || []).map(async (item) => {
            await cartModel.destroy({
                where: { plant_id: item.plant_id, user_id: req.user }
            });
        });

        await Promise.all(deleteCartPromises);

        const keys = ['cartOrProducts', 'shipping', 'pricing', 'payment'];
        await Promise.all(keys.map(async (key) => {
            await deleteData(req.user, req.orderToken, key);
        }));

        const legacyOrder = toLegacyOrder(refreshedResult);
        delete legacyOrder.payment.paymentId;
        delete legacyOrder.delivery;

        res.status(200).send({
            status: true,
            message: 'Payment Succeeded',
            result: legacyOrder
        });
    } catch (error) {
        next(error);
    }
};

exports.getLastOrder = async (req, res, next) => {
    try {
        const result = await Order.findAll({
            where: { user_id: req.user },
            include: [{ model: OrderItem, as: 'orderItems' }],
            order: [['id', 'DESC']],
            limit: 1
        });

        if (!result || result.length === 0) {
            const error = new Error('Order not found.');
            error.statusCode = 404;
            throw error;
        }

        const legacyOrders = result.map((order) => {
            const legacy = toLegacyOrder(order);
            delete legacy.payment.paymentId;
            delete legacy.delivery;
            return legacy;
        });

        res.status(200).send({
            status: true,
            message: 'Your Last Order.',
            result: legacyOrders
        });
    } catch (error) {
        next(error);
    }
};
