const { deleteResourcesByPrefix, deleteFolder, uploadImage } = require('../../utils/uploadImages');
const bcryptjs = require('bcryptjs');

const User = require('../../model/userModel/user');
const NurseryStoreTabs = require('../../model/nurseryModel/nurseryStoreTabs');
const NurseryStoreTemplates = require('../../model/nurseryModel/nurseryStoreTemplates');
const NurseryStoreBlocks = require('../../model/nurseryModel/nurseryStoreBlocks');
const Plant = require('../../model/nurseryModel/plants');
const Nursery = require('../../model/nurseryModel/nursery');
const Address = require('../../model/userModel/address');
const Cart = require('../../model/checkoutModel/cart');
const { getData, deleteData } = require('../../utils/redisVercelKv');
const { Order } = require('../../model/checkoutModel/orders');
const NurseryStoreContact = require('../../model/nurseryModel/nurseryStoreContact');

const toLegacyUser = (userInstance) => {
    if (!userInstance) return null;
    const user = userInstance.toJSON ? userInstance.toJSON() : userInstance;

    return {
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isUserVerified: user.isUserVerified,
        isTwoFactorAuthEnabled: user.isTwoFactorAuthEnabled,
        avatar: {
            public_id: user.avatar_public_id || '',
            url: user.avatar_url || ''
        },
        avatarList: user.avatarList || [],
        gender: user.gender,
        age: user.age
    };
};

exports.getUserProfile = async (req, res, next) => {
    try {
        const result = await User.findByPk(req.user);

        if (!result) {
            const error = new Error('Authentication Failed');
            error.statusCode = 403;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'User Data',
            result: toLegacyUser(result)
        });

    } catch (error) {
        next(error);
    }
};

exports.updateUserProfile = async (req, res, next) => {
    try {
        const { _id, name, phone, gender, age } = req.body;

        if (_id?.toString() !== req.user.toString()) {
            const error = new Error('Authentication Failed');
            error.statusCode = 403;
            throw error;
        }

        const updates = {};
        if (name !== null && name !== undefined) updates.name = name;
        if (phone !== null && phone !== undefined) updates.phone = phone;
        if (gender !== null && gender !== undefined) updates.gender = gender;
        if (age !== null && age !== undefined) updates.age = age;

        await User.update(updates, { where: { id: req.user } });
        const result = await User.findByPk(req.user);

        if (!result) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'User profile updated successfully',
            result: toLegacyUser(result)
        });

    } catch (error) {
        next(error);
    }
};

exports.deleteUserProfile = async (req, res, next) => {
    try {
        const userId = req.user;

        const deletedUser = await User.findByPk(userId);

        if (!deletedUser) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        await deletedUser.destroy();

        await Address.destroy({ where: { user_id: req.user } });
        await Cart.destroy({ where: { user_id: req.user } });
        await Order.destroy({ where: { user_id: req.user } });
        await NurseryStoreContact.destroy({ where: { user_id: req.user } });

        if (req.nursery) {
            await Nursery.destroy({ where: { id: req.nursery, user_id: req.user } });
            await NurseryStoreTabs.destroy({ where: { user_id: req.user, nursery_id: req.nursery } });
            await NurseryStoreTemplates.destroy({ where: { user_id: req.user, nursery_id: req.nursery } });
            await NurseryStoreBlocks.destroy({ where: { user_id: req.user, nursery_id: req.nursery } });
            await NurseryStoreContact.destroy({ where: { nursery_id: req.nursery } });
            await Plant.destroy({ where: { user_id: req.user, nursery_id: req.nursery } });

            await deleteResourcesByPrefix(`PlantSeller/user/${req.user}`, {
                type: 'upload',
                resource_type: 'image',
                invalidate: true
            });

            await deleteFolder(`PlantSeller/user/${req.user}`);
        }

        res.status(200).send({
            status: true,
            message: 'User profile deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.validateVerificationToken = async (req, res, next) => {
    const { token } = req.params;

    try {
        if (!token) {
            const error = new Error('Invalid Token Parameters');
            error.statusCode = 404;
            throw error;
        }

        const userData = await getData('root', token, 'verifyUser');

        if (!userData) {
            const error = new Error('Token Expired or does not exist');
            error.statusCode = 404;
            throw error;
        }

        const user = await User.findByPk(userData.userId);

        if (!user) {
            const error = new Error('Token Expired or does not exist');
            error.statusCode = 405;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Token is valid'
        });

    } catch (error) {
        next(error);
    }
};

exports.validatePasswordRestToken = async (req, res, next) => {
    const { token } = req.params;

    try {
        if (!token) {
            const error = new Error('Invalid Token Parameters');
            error.statusCode = 404;
            throw error;
        }

        const userData = await getData('root', token, 'resetPassword');

        if (!userData) {
            const error = new Error('Token Expired or does not exist');
            error.statusCode = 404;
            throw error;
        }

        const user = await User.findByPk(userData.userId);

        if (!user) {
            const error = new Error('Token Expired or does not exist');
            error.statusCode = 400;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Token is valid'
        });

    } catch (error) {
        next(error);
    }
};

exports.ResetPassword = async (req, res, next) => {
    const { token } = req.params;
    try {
        if (!token) {
            const error = new Error('Invalid Token Parameters');
            error.statusCode = 404;
            throw error;
        }

        const userData = await getData('root', token, 'resetPassword');

        if (!userData) {
            const error = new Error('Token Expired or does not exist');
            error.statusCode = 404;
            throw error;
        }

        const { password, confirmPassword } = req.body;

        if (!password || !confirmPassword) {
            const error = new Error('Password Parameter Missing');
            error.statusCode = 405;
            throw error;
        }

        if (password !== confirmPassword) {
            const error = new Error('Password and Confirm Password does not match');
            error.statusCode = 405;
            throw error;
        }

        const user = await User.findByPk(userData.userId);

        if (!user || userData.userId.toString() !== user.id.toString()) {
            await deleteData('root', token, 'resetPassword');
            const error = new Error('You are not verified, you may need to re-try');
            error.statusCode = 403;
            throw error;
        }

        user.password = password;
        await user.save();

        await deleteData('root', token, 'resetPassword');

        res.status(200).send({
            status: true,
            message: 'Password Changed successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyUser = async (req, res, next) => {
    const { token } = req.params;
    try {
        if (!token) {
            const error = new Error('Invalid Token Parameters');
            error.statusCode = 404;
            throw error;
        }

        const userData = await getData('root', token, 'verifyUser');

        if (!userData) {
            const error = new Error('Token Expired or does not exist');
            error.statusCode = 404;
            throw error;
        }

        const { isUserVerified } = req.body;

        const user = await User.findByPk(userData.userId);

        if (!user || !isUserVerified || userData.userId.toString() !== user.id.toString()) {
            await deleteData('root', token, 'verifyUser');
            const error = new Error('You are not verified, you may need to re-try');
            error.statusCode = 403;
            throw error;
        }

        user.isUserVerified = true;
        await user.save();

        await deleteData('root', token, 'verifyUser');

        res.status(200).send({
            status: true,
            message: 'User Verification completed!'
        });
    } catch (error) {
        next(error);
    }
};

exports.uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.files) {
            const error = new Error('Invalid Images to upload.');
            error.statusCode = 400;
            throw error;
        }

        let image;
        if (req.body.type === 'avatar') {
            image = req.files.avatar;
        } else {
            const error = new Error('Invalid File Upload.');
            error.statusCode = 400;
            throw error;
        }

        const upload = await uploadImage(image, {
            folder: `PlantSeller/user/${req.user}/profile`,
            tags: req.body.type
        });

        const uploaded = {
            public_id: upload.public_id,
            url: upload.secure_url
        };

        const user = await User.findByPk(req.user);

        if (!user) {
            const error = new Error('Failed to update image.');
            error.statusCode = 400;
            throw error;
        }

        user.avatar_public_id = uploaded.public_id;
        user.avatar_url = uploaded.url;
        user.avatarList = [...(user.avatarList || []), uploaded];

        await user.save();

        res.status(200).send({
            status: true,
            message: 'Image updated successfully.',
            result: toLegacyUser(user)
        });
    } catch (error) {
        next(error);
    }
};

exports.ChangePassword = async (req, res, next) => {
    try {
        const userId = req.user;

        if (!userId) {
            const error = new Error('Unauthorized access');
            error.statusCode = 403;
            throw error;
        }

        const user = await User.findByPk(userId);

        if (!user) {
            const error = new Error('Invalid User');
            error.statusCode = 401;
            throw error;
        }

        const { previousPassword, password } = req.body;

        const isMatch = await bcryptjs.compare(previousPassword, user.password);
        if (!isMatch) {
            const error = new Error('Previous password is incorrect');
            error.statusCode = 403;
            throw error;
        }

        user.password = password;
        await user.save();

        res.status(200).send({
            status: true,
            message: 'Password updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.EnableDisableTwoFactorAuthentication = async (req, res, next) => {
    try {
        const userId = req.user;

        if (!userId) {
            const error = new Error('Unauthorized access');
            error.statusCode = 403;
            throw error;
        }

        const { isTwoFactorAuthEnabled } = req.body;

        if (isTwoFactorAuthEnabled === undefined || isTwoFactorAuthEnabled === null) {
            const error = new Error('Two Factor Authentication Parameter is required');
            error.statusCode = 400;
            throw error;
        }

        await User.update({ isTwoFactorAuthEnabled }, { where: { id: userId } });
        const user = await User.findByPk(userId);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Two Factor Authentication status updated successfully',
            result: toLegacyUser(user)
        });
    } catch (error) {
        next(error);
    }
};
