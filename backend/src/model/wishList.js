const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const WishList = sequelize.define('wish_list', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    plant_id: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'wish_lists',
    timestamps: false
});

module.exports = WishList;