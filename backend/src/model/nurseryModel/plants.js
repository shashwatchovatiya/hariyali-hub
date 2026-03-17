const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const Plant = sequelize.define('plant', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nursery_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plantName: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    discount: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    images: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    imagesList: {
        type: DataTypes.JSON,
        defaultValue: []
    },
    noOfVisit: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    postedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'plants',
    timestamps: false
});

Plant.prototype.increaseVisit = async function () {
    try {
        this.noOfVisit = (this.noOfVisit || 0) + 1;
        await this.save();
    } catch (error) {
        console.log(error);
    }
};

module.exports = Plant;