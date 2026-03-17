const { Op } = require('sequelize');
const Plant = require('../model/nurseryModel/plants');
const Nursery = require('../model/nurseryModel/nursery');

const includeNursery = {
    model: Nursery,
    as: 'nursery',
    attributes: ['id', 'nurseryName']
};

const toLegacyPlant = (plantInstance) => {
    const plant = plantInstance.toJSON ? plantInstance.toJSON() : plantInstance;

    return {
        _id: plant.id,
        user: plant.user_id,
        nursery: plant.nursery ? {
            _id: plant.nursery.id,
            nurseryName: plant.nursery.nurseryName
        } : plant.nursery_id,
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

exports.getAllPlants = async (req, res, next) => {
    try {
        const result = await Plant.findAll({ include: [includeNursery] });

        res.status(200).send({
            status: true,
            message: 'Data of all products',
            result: result.map(toLegacyPlant)
        });
    } catch (error) {
        next(error);
    }
};

exports.getPlantById = async (req, res, next) => {
    try {
        const result = await Plant.findByPk(req.params.id, { include: [includeNursery] });

        if (!result) {
            const error = new Error('No Product Found');
            error.statusCode = 404;
            throw error;
        }

        await result.increaseVisit();

        res.status(200).send({
            status: true,
            message: 'Data of Product',
            result: toLegacyPlant(result)
        });
    } catch (error) {
        next(error);
    }
};

exports.getPlantsByCategory = async (req, res, next) => {
    try {
        const category = req.params.id;

        if (!category) {
            const error = new Error('Category is required');
            error.statusCode = 400;
            throw error;
        }

        const where = {};

        if (category.toLowerCase() !== 'all') {
            const categoryList = category.split(',').map((cat) => cat.trim()).filter(Boolean);
            where[Op.or] = categoryList.map((cat) => ({
                category: { [Op.like]: `%${cat}%` }
            }));
        }

        const result = await Plant.findAll({ where, include: [includeNursery] });

        res.status(200).send({
            status: true,
            message: `Data For ${category}`,
            result: result.map(toLegacyPlant)
        });
    } catch (error) {
        next(error);
    }
};

exports.searchProducts = async (req, res, next) => {
    try {
        const { search, category } = req.query;

        if (!search) {
            const error = new Error('Search query is required');
            error.statusCode = 400;
            throw error;
        }

        const keywords = search.trim().split(/\s+/).filter(Boolean);
        const numericKeywords = keywords.map((keyword) => Number(keyword)).filter((value) => !Number.isNaN(value));

        const where = {
            [Op.or]: [
                ...keywords.map((keyword) => ({ plantName: { [Op.like]: `%${keyword}%` } })),
                ...keywords.map((keyword) => ({ description: { [Op.like]: `%${keyword}%` } })),
                ...keywords.map((keyword) => ({ category: { [Op.like]: `%${keyword}%` } })),
                ...(numericKeywords.length > 0 ? [{ price: { [Op.in]: numericKeywords } }] : [])
            ]
        };

        if (category && category.toLowerCase() !== 'all') {
            const categoryList = category.split(',').map((cat) => cat.trim()).filter(Boolean);
            where[Op.and] = [{
                [Op.or]: categoryList.map((cat) => ({ category: { [Op.like]: `%${cat}%` } }))
            }];
        }

        const products = await Plant.findAll({ where, include: [includeNursery] });

        res.status(200).json({
            status: true,
            message: products.length ? 'Search results found' : 'No matching results found',
            result: products.map(toLegacyPlant)
        });

    } catch (error) {
        next(error);
    }
};
