// models/Contact.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const Contact = sequelize.define('contact', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    tableName: 'contacts',
    timestamps: false
});

module.exports = Contact;
