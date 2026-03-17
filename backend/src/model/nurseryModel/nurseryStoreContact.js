const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const NurseryStoreContact = sequelize.define('nursery_store_contact', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nursery_id: { type: DataTypes.INTEGER, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    isMessageViewed: { type: DataTypes.BOOLEAN, defaultValue: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'nursery_store_contacts',
    timestamps: false
});

module.exports = NurseryStoreContact;