const { DataTypes } = require('sequelize');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { encryptMessage } = require('../../utils/cryptoUtil');
const sequelize = require('../../config/database/db');

const User = sequelize.define('user', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.JSON,
        defaultValue: ['user']
    },
    isUserVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isTwoFactorAuthEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
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
    gender: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: false,
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcryptjs.genSalt(10);
                user.password = await bcryptjs.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcryptjs.genSalt(10);
                user.password = await bcryptjs.hash(user.password, salt);
            }
        }
    }
});

User.prototype.generateAuthToken = async function () {
    try {
        const accessToken = jwt.sign(
            { _id: this.id.toString() },
            process.env.ACCESS_SECRET_KEY,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { _id: this.id.toString() },
            process.env.REFRESH_SECRET_KEY,
            { expiresIn: '30d' }
        );

        // Save refresh token to user_tokens table
        const UserToken = require('./userToken');
        await UserToken.create({ user_id: this.id, token: refreshToken });

        return { refreshToken: encryptMessage(refreshToken), accessToken };
    } catch (err) {
        console.log(err);
        throw err;
    }
};

module.exports = User;