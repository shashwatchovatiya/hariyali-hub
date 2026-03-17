const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const NurseryStoreTab = sequelize.define('nursery_store_tab', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nursery_id: { type: DataTypes.INTEGER, allowNull: false },
    tabName: { type: DataTypes.STRING(200), allowNull: false },
    status: { type: DataTypes.STRING(50), defaultValue: 'draft' },
    index: { type: DataTypes.INTEGER, allowNull: false }
}, {
    tableName: 'nursery_store_tabs',
    timestamps: false
});

module.exports = NurseryStoreTab;