// models/SubscriberEmail.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const SubscriberEmail = sequelize.define('subscriber_email', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'subscriber_emails',
    timestamps: false
});

module.exports = SubscriberEmail;
