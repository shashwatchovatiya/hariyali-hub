const User = require('../../model/userModel/user');
const Nursery = require('../../model/nurseryModel/nursery');
const Plant = require('../../model/nurseryModel/plants');
const NurseryStoreTabs = require('../../model/nurseryModel/nurseryStoreTabs');
const { deleteFolder, deleteResourcesByPrefix, uploadImage } = require('../../utils/uploadImages');

const toLegacyNursery = (nurseryInstance) => {
    if (!nurseryInstance) return null;

    const nursery = nurseryInstance.toJSON ? nurseryInstance.toJSON() : nurseryInstance;

    return {
        _id: nursery.id,
        user: nursery.user_id,
        nurseryOwnerName: nursery.nurseryOwnerName,
        nurseryName: nursery.nurseryName,
        avatar: {
            public_id: nursery.avatar_public_id || '',
            url: nursery.avatar_url || ''
        },
        avatarList: nursery.avatarList || [],
        cover: {
            public_id: nursery.cover_public_id || '',
            url: nursery.cover_url || ''
        },
        coverList: nursery.coverList || [],
        nurseryEmail: nursery.nurseryEmail,
        nurseryPhone: nursery.nurseryPhone,
        address: nursery.address,
        pinCode: nursery.pinCode,
        city: nursery.city,
        state: nursery.state
    };
};

const removeSensitiveNurseryLists = (legacyNursery) => {
    const result = { ...legacyNursery };
    delete result.avatarList;
    delete result.coverList;
    return result;
};

exports.createNurseryProfile = async (req, res, next) => {
    try {
        if (req.nursery || req.role.includes('seller')) {
            const error = new Error('Nursery already registered');
            error.statusCode = 403;
            throw error;
        }

        const addNursery = await Nursery.create({
            ...req.body,
            user_id: req.user
        });

        const user = await User.findByPk(req.user);

        if (!user) {
            const error = new Error('Nursery Listed Failure');
            error.statusCode = 400;
            throw error;
        }

        const roles = Array.isArray(user.role) ? user.role : [];
        if (!roles.includes('seller')) {
            user.role = [...roles, 'seller'];
            await user.save();
        }

        res.status(200).send({
            status: true,
            message: 'Nursery Listed Successfully.',
            result: toLegacyNursery(addNursery)
        });
    } catch (error) {
        next(error);
    }
};

exports.getNurseryDetail = async (req, res, next) => {
    try {
        if (!req.nursery || !req.role.includes('seller')) {
            const error = new Error('You Are Not Allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const result = await Nursery.findOne({ where: { user_id: req.user, id: req.nursery } });

        if (!result) {
            const error = new Error('Nursery detail not found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Nursery detail retrieved.',
            result: removeSensitiveNurseryLists(toLegacyNursery(result))
        });
    } catch (error) {
        next(error);
    }
};

exports.updateNurseryDetail = async (req, res, next) => {
    try {
        if (!req.nursery || !req.role.includes('seller')) {
            const error = new Error('You Are Not Allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        if (req.body.nurseryEmail || req.body.nurseryPhone || req.body.nurseryOwnerName) {
            const error = new Error('You Are Not Allowed to edit this field');
            error.statusCode = 403;
            throw error;
        }

        await Nursery.update(req.body, { where: { user_id: req.user, id: req.nursery } });
        const result = await Nursery.findOne({ where: { user_id: req.user, id: req.nursery } });

        if (!result) {
            const error = new Error('Nursery detail not found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Nursery detail Updated.',
            result: toLegacyNursery(result)
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteNurseryDetail = async (req, res, next) => {
    try {
        if (!req.role.includes('seller') || !req.nursery) {
            const error = new Error('You Are Not Allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const result = await Nursery.findOne({ where: { id: req.nursery, user_id: req.user } });

        if (!result) {
            const error = new Error('Nursery detail not found.');
            error.statusCode = 404;
            throw error;
        }

        await result.destroy();

        const user = await User.findByPk(req.user);

        if (!user) {
            const error = new Error('Nursery deleted failed.');
            error.statusCode = 400;
            throw error;
        }

        user.role = (Array.isArray(user.role) ? user.role : []).filter((role) => role !== 'seller');
        await user.save();

        await Plant.destroy({ where: { user_id: req.user, nursery_id: req.nursery } });
        await NurseryStoreTabs.destroy({ where: { user_id: req.user, nursery_id: req.nursery } });

        await deleteResourcesByPrefix(`PlantSeller/user/${req.user}/nursery`, {
            type: 'upload',
            resource_type: 'image',
            invalidate: true
        });

        await deleteFolder(`PlantSeller/user/${req.user}/nursery`);

        res.status(200).send({
            status: true,
            message: 'Nursery deleted successfully.'
        });
    } catch (error) {
        next(error);
    }
};

exports.uploadNurseryImage = async (req, res, next) => {
    try {
        if (!req.role.includes('seller') || !req.nursery) {
            const error = new Error('You Are Not Allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        if (!req.files) {
            const error = new Error('Invalid Images to upload.');
            error.statusCode = 400;
            throw error;
        }

        let image;
        if (req.body.type === 'avatar') {
            image = req.files.avatar;
        } else if (req.body.type === 'cover') {
            image = req.files.cover;
        } else {
            const error = new Error('Invalid File Upload.');
            error.statusCode = 400;
            throw error;
        }

        const upload = await uploadImage(image, {
            folder: `PlantSeller/user/${req.user}/nursery/${req.nursery}/${req.body.type}`,
            tags: req.body.type
        });

        const uploadedImage = {
            public_id: upload.public_id,
            url: upload.secure_url
        };

        const result = await Nursery.findOne({ where: { user_id: req.user, id: req.nursery } });

        if (!result) {
            const error = new Error('Failed to update image.');
            error.statusCode = 400;
            throw error;
        }

        if (req.body.type === 'avatar') {
            result.avatar_public_id = uploadedImage.public_id;
            result.avatar_url = uploadedImage.url;
            result.avatarList = [...(result.avatarList || []), uploadedImage];
        } else {
            result.cover_public_id = uploadedImage.public_id;
            result.cover_url = uploadedImage.url;
            result.coverList = [...(result.coverList || []), uploadedImage];
        }

        await result.save();

        res.status(200).send({
            status: true,
            message: 'Image updated successfully.',
            result: toLegacyNursery(result)
        });
    } catch (error) {
        next(error);
    }
};

exports.getNurseryImages = async (req, res, next) => {
    try {
        if (!req.role.includes('seller') || !req.nursery) {
            const error = new Error('You Are Not Allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const result = await Nursery.findOne({ where: { user_id: req.user, id: req.nursery } });

        if (!result) {
            const error = new Error('Nursery not found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Nursery images retrieved successfully.',
            result: {
                avatarList: result.avatarList || [],
                coverList: result.coverList || []
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.updateNurseryImages = async (req, res, next) => {
    try {
        if (!req.role.includes('seller') || !req.nursery) {
            const error = new Error('You Are Not Allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const { public_id, url, type } = req.body;
        const result = await Nursery.findOne({ where: { user_id: req.user, id: req.nursery } });

        if (!result) {
            const error = new Error('Failed to update nursery images.');
            error.statusCode = 400;
            throw error;
        }

        if (type === 'avatar') {
            result.avatar_public_id = public_id;
            result.avatar_url = url;
        } else if (type === 'cover') {
            result.cover_public_id = public_id;
            result.cover_url = url;
        }

        await result.save();

        res.status(200).send({
            status: true,
            message: 'Nursery image updated successfully.',
            result: toLegacyNursery(result)
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteNurseryImage = async (req, res, next) => {
    try {
        if (!req.role.includes('seller') || !req.nursery) {
            const error = new Error('You are not allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const { imageId, type } = req.body;
        const result = await Nursery.findOne({ where: { user_id: req.user, id: req.nursery } });

        if (!result) {
            const error = new Error('Nursery not found.');
            error.statusCode = 404;
            throw error;
        }

        if (type === 'avatar') {
            result.avatarList = (result.avatarList || []).filter((image) => (image.public_id !== imageId) && (image._id !== imageId));
        } else {
            result.coverList = (result.coverList || []).filter((image) => (image.public_id !== imageId) && (image._id !== imageId));
        }

        await result.save();

        res.status(200).send({
            status: true,
            message: 'Image deleted successfully.',
            result: toLegacyNursery(result)
        });
    } catch (error) {
        next(error);
    }
};
