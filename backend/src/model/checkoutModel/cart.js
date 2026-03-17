const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const Cart = sequelize.define('cart', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nursery_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plant_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    priceWithoutDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    priceAfterDiscount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    discountPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    addedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'carts',
    timestamps: false
});

module.exports = Cart;
