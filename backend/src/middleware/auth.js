// jsonwebtoken to generate secret
const jwt = require('jsonwebtoken');

// import Sequelize models
const User = require('../model/userModel/user');
const Nursery = require('../model/nurseryModel/nursery');


const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            const error = new Error("Authentication failed");
            error.statusCode = 403;
            throw error;
        }

        const token = authHeader.split(' ')[1];

        if (!token || token === 'null' || token === 'undefined') {
            const error = new Error("Authentication failed");
            error.statusCode = 403;
            throw error;
        }

        console.log(`[AUTH] Token received: ${token.substring(0, 10)}...`);
        const verifyUser = jwt.verify(token, process.env.ACCESS_SECRET_KEY);
        console.log(`[AUTH] Decoded payload:`, verifyUser);

        if (!verifyUser) {
            const error = new Error("Authentication failed!");
            error.statusCode = 403;
            throw error;
        }

        // Find user by primary key (id stored in JWT as _id)
        const user = await User.findOne({
            where: { id: verifyUser._id },
            attributes: ['id', 'role', 'isUserVerified']
        });
        console.log(`[AUTH] User lookup result:`, user ? user.id : null);

        if (!user) {
            const error = new Error("Authentication failed");
            error.statusCode = 403;
            throw error;
        }

        if (!user.isUserVerified) {
            const error = new Error("Your Account is not verified please login and verify your account");
            error.statusCode = 403;
            throw error;
        }

        req.token = token;
        req.user = user.id;
        req.role = user.role;

        if (req.role.includes("seller")) {
            const nursery = await Nursery.findOne({
                where: { user_id: user.id },
                attributes: ['id']
            });
            req.nursery = nursery ? nursery.id : null;
        }

        next();

    } catch (error) {
        next(error);
    }
};

module.exports = auth;