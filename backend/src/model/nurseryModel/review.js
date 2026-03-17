const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const Review = sequelize.define('review', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nursery_id: { type: DataTypes.INTEGER, allowNull: false },
    plant_id: { type: DataTypes.INTEGER, allowNull: false },
    rating: { type: DataTypes.DECIMAL(2, 1), allowNull: false },
    review: { type: DataTypes.TEXT, defaultValue: '' },
    upVote: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: 'reviews',
    timestamps: false
});

module.exports = Review;
