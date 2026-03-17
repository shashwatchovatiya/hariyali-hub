const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const Delivery = sequelize.define('delivery', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    deliveryName: { type: DataTypes.STRING(100), allowNull: false },
    avatar_public_id: { type: DataTypes.STRING(500), defaultValue: '' },
    avatar_url: { type: DataTypes.STRING(1000), defaultValue: '' },
    avatarList: { type: DataTypes.JSON, defaultValue: [] },
    deliveryEmail: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    deliveryPhone: { type: DataTypes.STRING(20), allowNull: false, unique: true },
    address: { type: DataTypes.TEXT, allowNull: false },
    pinCode: { type: DataTypes.INTEGER, allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    state: { type: DataTypes.STRING(100), allowNull: false },
    workingPinCodes: { type: DataTypes.JSON, defaultValue: [] }
}, {
    tableName: 'deliveries',
    timestamps: false
});

module.exports = Delivery;