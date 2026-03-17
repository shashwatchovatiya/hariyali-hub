const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const SaveForLater = sequelize.define('save_for_later', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plant_id: { type: DataTypes.INTEGER, allowNull: false },
    addedAtPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    addedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'save_for_later',
    timestamps: false
});

module.exports = SaveForLater;