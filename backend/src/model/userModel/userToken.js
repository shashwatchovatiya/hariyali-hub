const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const UserToken = sequelize.define('user_token', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    token: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'user_tokens',
    timestamps: false
});

module.exports = UserToken;
