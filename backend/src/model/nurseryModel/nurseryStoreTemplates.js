const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database/db');

const NurseryStoreTemplate = sequelize.define('nursery_store_template', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    nursery_id: { type: DataTypes.INTEGER, allowNull: false },
    nurseryStoreTabs_id: { type: DataTypes.INTEGER, allowNull: false },
    index: { type: DataTypes.INTEGER, allowNull: false },
    templateName: { type: DataTypes.STRING(200), allowNull: false }
}, {
    tableName: 'nursery_store_templates',
    timestamps: false
});

module.exports = NurseryStoreTemplate;