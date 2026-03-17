const { DataTypes } = require('sequelize');
const sequelize = require('../config/database/db');

const KV = sequelize.define('kv', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    token: {
        type: DataTypes.STRING(500),
        allowNull: false
    },
    key: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    data: {
        type: DataTypes.JSON,
        allowNull: false
    },
    expireAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'kv_store',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'token', 'key'], unique: true },
        { fields: ['expireAt'] }
    ]
});

module.exports = KV;
