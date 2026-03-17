const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const VisitedProduct = sequelize.define('visited_product', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plant_id: { type: DataTypes.INTEGER, allowNull: false },
    count: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastVisitedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'visited_products',
    timestamps: false
});

module.exports = VisitedProduct;