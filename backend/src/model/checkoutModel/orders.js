const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

// Order master table
const Order = sequelize.define('order', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // Shipping Info
    shipping_name: { type: DataTypes.STRING(100), allowNull: false },
    shipping_phone: { type: DataTypes.STRING(20), allowNull: false },
    shipping_pinCode: { type: DataTypes.STRING(10), allowNull: false },
    shipping_address: { type: DataTypes.TEXT, allowNull: false },
    shipping_landmark: { type: DataTypes.STRING(255), defaultValue: '' },
    shipping_city: { type: DataTypes.STRING(100), allowNull: false },
    shipping_state: { type: DataTypes.STRING(100), allowNull: false },
    // Pricing
    totalPriceWithoutDiscount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    actualPriceAfterDiscount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discountPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    deliveryPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    totalPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // Order metadata
    orderAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    // Payment
    paymentId: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    paymentStatus: { type: DataTypes.STRING(50), defaultValue: 'pending' },
    paymentMessage: { type: DataTypes.STRING(500), defaultValue: 'Waiting for payment confirmation!' },
    paymentMethods: { type: DataTypes.STRING(100), allowNull: false },
    // Delivery
    delivery_id: { type: DataTypes.INTEGER, allowNull: true },
    deliveryPersonName: { type: DataTypes.STRING(100), allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true }
}, {
    tableName: 'orders',
    timestamps: false
});

// Order Items table
const OrderItem = sequelize.define('order_item', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    order_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plant_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nursery_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nurseryName: { type: DataTypes.STRING(200), allowNull: false },
    plantName: { type: DataTypes.STRING(200), allowNull: false },
    image_public_id: { type: DataTypes.STRING(500), allowNull: false },
    image_url: { type: DataTypes.STRING(1000), allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount: { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    orderStatus: { type: DataTypes.STRING(50), defaultValue: 'pending' },
    orderStatusMessage: { type: DataTypes.STRING(500), defaultValue: '' },
    statusAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'order_items',
    timestamps: false
});

// Association
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'orderItems' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

module.exports = { Order, OrderItem };
