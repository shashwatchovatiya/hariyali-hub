/**
 * Central model index - registers all Sequelize models and sets up associations.
 * Import this file once in index.js to ensure all tables are created.
 */

const User = require('./userModel/user');
const UserToken = require('./userModel/userToken');
const Address = require('./userModel/address');

const Nursery = require('./nurseryModel/nursery');
const Plant = require('./nurseryModel/plants');
const Review = require('./nurseryModel/review');
const NurseryStoreTab = require('./nurseryModel/nurseryStoreTabs');
const NurseryStoreTemplate = require('./nurseryModel/nurseryStoreTemplates');
const NurseryStoreBlock = require('./nurseryModel/nurseryStoreBlocks');
const NurseryStoreContact = require('./nurseryModel/nurseryStoreContact');

const { Order, OrderItem } = require('./checkoutModel/orders');
const Cart = require('./checkoutModel/cart');

const Contact = require('./contact');
const SubscriberEmail = require('./subscriberEmail');
const WishList = require('./wishList');
const SaveForLater = require('./saveForLater');
const VisitedProduct = require('./visitedProducts');
const Delivery = require('./delivery');
const KV = require('./kvModel');

// ── Associations ──────────────────────────────────────────────────────────────

// User ↔ UserToken
User.hasMany(UserToken, { foreignKey: 'user_id', as: 'tokens', onDelete: 'CASCADE' });
UserToken.belongsTo(User, { foreignKey: 'user_id' });

// User ↔ Address
User.hasMany(Address, { foreignKey: 'user_id', as: 'addresses', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'user_id' });

// User ↔ Nursery (one-to-one)
User.hasOne(Nursery, { foreignKey: 'user_id', as: 'nursery', onDelete: 'SET NULL' });
Nursery.belongsTo(User, { foreignKey: 'user_id' });

// Nursery ↔ Plant
Nursery.hasMany(Plant, { foreignKey: 'nursery_id', as: 'plants', onDelete: 'CASCADE' });
Plant.belongsTo(Nursery, { foreignKey: 'nursery_id', as: 'nursery' });

// User ↔ Plant
User.hasMany(Plant, { foreignKey: 'user_id', as: 'plants', onDelete: 'CASCADE' });
Plant.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Plant ↔ Review
Plant.hasMany(Review, { foreignKey: 'plant_id', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Plant, { foreignKey: 'plant_id' });

// Nursery ↔ Review
Nursery.hasMany(Review, { foreignKey: 'nursery_id', onDelete: 'CASCADE' });
Review.belongsTo(Nursery, { foreignKey: 'nursery_id' });

// User ↔ Review
User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id' });

// Cart
User.hasMany(Cart, { foreignKey: 'user_id', as: 'cartItems', onDelete: 'CASCADE' });
Cart.belongsTo(User, { foreignKey: 'user_id' });
Nursery.hasMany(Cart, { foreignKey: 'nursery_id', onDelete: 'CASCADE' });
Cart.belongsTo(Nursery, { foreignKey: 'nursery_id', as: 'nursery' });
Plant.hasMany(Cart, { foreignKey: 'plant_id', onDelete: 'CASCADE' });
Cart.belongsTo(Plant, { foreignKey: 'plant_id', as: 'plant' });

// Orders
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders', onDelete: 'CASCADE' });
Order.belongsTo(User, { foreignKey: 'user_id' });

// OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'orderItems', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Plant.hasMany(OrderItem, { foreignKey: 'plant_id', onDelete: 'SET NULL' });
OrderItem.belongsTo(Plant, { foreignKey: 'plant_id' });
Nursery.hasMany(OrderItem, { foreignKey: 'nursery_id', onDelete: 'SET NULL' });
OrderItem.belongsTo(Nursery, { foreignKey: 'nursery_id' });

// WishList
User.hasMany(WishList, { foreignKey: 'user_id', as: 'wishList', onDelete: 'CASCADE' });
WishList.belongsTo(User, { foreignKey: 'user_id' });
Plant.hasMany(WishList, { foreignKey: 'plant_id', onDelete: 'CASCADE' });
WishList.belongsTo(Plant, { foreignKey: 'plant_id' });

// SaveForLater
User.hasMany(SaveForLater, { foreignKey: 'user_id', as: 'saveForLater', onDelete: 'CASCADE' });
SaveForLater.belongsTo(User, { foreignKey: 'user_id' });
Plant.hasMany(SaveForLater, { foreignKey: 'plant_id', as: 'saveForLater', onDelete: 'CASCADE' });
SaveForLater.belongsTo(Plant, { foreignKey: 'plant_id' });

// VisitedProduct
User.hasMany(VisitedProduct, { foreignKey: 'user_id', onDelete: 'CASCADE' });
VisitedProduct.belongsTo(User, { foreignKey: 'user_id' });
Plant.hasMany(VisitedProduct, { foreignKey: 'plant_id', onDelete: 'CASCADE' });
VisitedProduct.belongsTo(Plant, { foreignKey: 'plant_id' });

// Nursery Store
Nursery.hasMany(NurseryStoreTab, { foreignKey: 'nursery_id', onDelete: 'CASCADE' });
NurseryStoreTab.belongsTo(Nursery, { foreignKey: 'nursery_id' });
User.hasMany(NurseryStoreTab, { foreignKey: 'user_id', onDelete: 'CASCADE' });
NurseryStoreTab.belongsTo(User, { foreignKey: 'user_id' });

NurseryStoreTab.hasMany(NurseryStoreTemplate, { foreignKey: 'nurseryStoreTabs_id', onDelete: 'CASCADE' });
NurseryStoreTemplate.belongsTo(NurseryStoreTab, { foreignKey: 'nurseryStoreTabs_id' });
Nursery.hasMany(NurseryStoreTemplate, { foreignKey: 'nursery_id', onDelete: 'CASCADE' });
NurseryStoreTemplate.belongsTo(Nursery, { foreignKey: 'nursery_id' });

NurseryStoreTemplate.hasMany(NurseryStoreBlock, { foreignKey: 'nurseryStoreTemplates_id', onDelete: 'CASCADE' });
NurseryStoreBlock.belongsTo(NurseryStoreTemplate, { foreignKey: 'nurseryStoreTemplates_id' });
NurseryStoreTab.hasMany(NurseryStoreBlock, { foreignKey: 'nurseryStoreTabs_id', onDelete: 'CASCADE' });
NurseryStoreBlock.belongsTo(NurseryStoreTab, { foreignKey: 'nurseryStoreTabs_id' });
Nursery.hasMany(NurseryStoreBlock, { foreignKey: 'nursery_id', onDelete: 'CASCADE' });
NurseryStoreBlock.belongsTo(Nursery, { foreignKey: 'nursery_id' });

Nursery.hasMany(NurseryStoreContact, { foreignKey: 'nursery_id', onDelete: 'CASCADE' });
NurseryStoreContact.belongsTo(Nursery, { foreignKey: 'nursery_id' });

// Delivery
User.hasOne(Delivery, { foreignKey: 'user_id', as: 'delivery', onDelete: 'SET NULL' });
Delivery.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
    User, UserToken, Address,
    Nursery, Plant, Review,
    NurseryStoreTab, NurseryStoreTemplate, NurseryStoreBlock, NurseryStoreContact,
    Order, OrderItem, Cart,
    Contact, SubscriberEmail, WishList, SaveForLater, VisitedProduct, Delivery, KV
};
