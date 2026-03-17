const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const NurseryStoreBlock = sequelize.define('nursery_store_block', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nursery_id: { type: DataTypes.INTEGER, allowNull: false },
    nurseryStoreTabs_id: { type: DataTypes.INTEGER, allowNull: false },
    nurseryStoreTemplates_id: { type: DataTypes.INTEGER, allowNull: false },
    index: { type: DataTypes.INTEGER, allowNull: false },
    image_public_id: { type: DataTypes.STRING(500), allowNull: false },
    image_url: { type: DataTypes.STRING(1000), allowNull: false },
    isProduct: { type: DataTypes.BOOLEAN, defaultValue: false },
    url: { type: DataTypes.STRING(2000), allowNull: false },
    title: { type: DataTypes.STRING(500), allowNull: false }
}, {
    tableName: 'nursery_store_blocks',
    timestamps: false
});

module.exports = NurseryStoreBlock;