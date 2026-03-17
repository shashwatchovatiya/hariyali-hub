const { uploadImages, deleteResourcesByPrefix, deleteFolder } = require('../../utils/uploadImages');
const Plant = require('../../model/nurseryModel/plants');

const toLegacyPlant = (plantInstance) => {
    if (!plantInstance) return null;

    const plant = plantInstance.toJSON ? plantInstance.toJSON() : plantInstance;

    return {
        _id: plant.id,
        user: plant.user_id,
        nursery: plant.nursery_id,
        plantName: plant.plantName,
        price: Number(plant.price),
        discount: Number(plant.discount),
        stock: plant.stock,
        category: plant.category,
        description: plant.description,
        images: plant.images || [],
        imagesList: plant.imagesList || [],
        noOfVisit: plant.noOfVisit,
        postedAt: plant.postedAt
    };
};

exports.addNewPlant = async (req, res, next) => {
    try {
        const { user, role, nursery, body, files } = req;

        if (!nursery || !role.includes('seller')) {
            const error = new Error('You are not allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const plant = await Plant.create({
            ...body,
            user_id: user,
            nursery_id: nursery
        });

        const images = [files?.image_0, files?.image_1, files?.image_2].filter(Boolean);

        if (images.length > 0) {
            const resultImage = await uploadImages(images, {
                folder: `PlantSeller/user/${user}/nursery/${nursery}/plants/${plant.id}`,
                width: 550,
                height: 650,
                crop: 'fit'
            });

            plant.images = resultImage.map((elem) => ({
                public_id: elem.public_id,
                url: elem.secure_url
            }));

            plant.imagesList = resultImage.map((elem) => ({
                public_id: elem.public_id,
                url: elem.url
            }));

            await plant.save();
        }

        res.status(200).send({
            status: true,
            message: 'New plant added successfully.',
            result: toLegacyPlant(plant)
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllPlantsOfNursery = async (req, res, next) => {
    try {
        const { user, role, nursery } = req;

        if (!nursery || !role.includes('seller')) {
            const error = new Error('You are not allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const result = await Plant.findAll({ where: { user_id: user, nursery_id: nursery } });

        res.status(200).send({
            status: true,
            message: 'Plants Found successfully.',
            result: result.map(toLegacyPlant)
        });
    } catch (error) {
        next(error);
    }
};

exports.getPlantById = async (req, res, next) => {
    try {
        const { user, role, nursery } = req;

        if (!nursery || !role.includes('seller')) {
            const error = new Error('You are not allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const result = await Plant.findOne({ where: { user_id: user, nursery_id: nursery, id: req.params.id } });

        if (!result) {
            const error = new Error('No Plant Found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Plant Found successfully.',
            result: toLegacyPlant(result)
        });

    } catch (error) {
        next(error);
    }
};

exports.updatePlantById = async (req, res, next) => {
    try {
        const { user, role, nursery } = req;

        if (!nursery || !role.includes('seller')) {
            const error = new Error('You are not allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        await Plant.update(req.body, { where: { user_id: user, nursery_id: nursery, id: req.params.id } });
        const result = await Plant.findOne({ where: { user_id: user, nursery_id: nursery, id: req.params.id } });

        if (!result) {
            const error = new Error('No Plant Found.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Plant updated successfully.',
            result: toLegacyPlant(result)
        });

    } catch (error) {
        next(error);
    }
};

exports.deletePlantById = async (req, res, next) => {
    try {
        const { user, role, nursery } = req;

        if (!nursery || !role.includes('seller')) {
            const error = new Error('You are not allowed to access this route');
            error.statusCode = 403;
            throw error;
        }

        const result = await Plant.findOne({ where: { user_id: user, nursery_id: nursery, id: req.params.id } });

        if (!result) {
            const error = new Error('No Plant Found.');
            error.statusCode = 404;
            throw error;
        }

        await result.destroy();

        await deleteResourcesByPrefix(`PlantSeller/user/${user}/nursery/${nursery}/plants/${req.params.id}`, {
            type: 'upload',
            resource_type: 'image',
            invalidate: true
        });

        await deleteFolder(`PlantSeller/user/${user}/nursery/${nursery}/plants/${req.params.id}`);

        res.status(200).send({
            status: true,
            message: 'Plant deleted successfully.'
        });

    } catch (error) {
        next(error);
    }
};
