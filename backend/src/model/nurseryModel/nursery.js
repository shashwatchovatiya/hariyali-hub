const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const Nursery = sequelize.define('nursery', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
    },
    nurseryOwnerName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nurseryName: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    avatar_public_id: {
        type: DataTypes.STRING(500),
        defaultValue: ''
    },
    avatar_url: {
        type: DataTypes.STRING(1000),
        defaultValue: ''
    },
    avatarList: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    cover_public_id: {
        type: DataTypes.STRING(500),
        defaultValue: ''
    },
    cover_url: {
        type: DataTypes.STRING(1000),
        defaultValue: ''
    },
    coverList: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    nurseryEmail: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    nurseryPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    pinCode: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'nurseries',
    timestamps: false
});

module.exports = Nursery;
