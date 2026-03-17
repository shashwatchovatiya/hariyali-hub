const cartModel = require('../../model/checkoutModel/cart');
const Plant = require('../../model/nurseryModel/plants');
const Nursery = require('../../model/nurseryModel/nursery');

const cartInclude = [
    {
        model: Nursery,
        as: 'nursery',
        attributes: ['id', 'nurseryName']
    },
    {
        model: Plant,
        as: 'plant',
        attributes: ['id', 'plantName', 'price', 'discount', 'stock', 'images']
    }
];

const toLegacyCart = (cartInstance) => {
    if (!cartInstance) return null;

    const cart = cartInstance.toJSON ? cartInstance.toJSON() : cartInstance;

    return {
        _id: cart.id,
        user: cart.user_id,
        nursery: cart.nursery ? {
            _id: cart.nursery.id,
            nurseryName: cart.nursery.nurseryName
        } : cart.nursery_id,
        plant: cart.plant ? {
            _id: cart.plant.id,
            plantName: cart.plant.plantName,
            price: Number(cart.plant.price),
            discount: Number(cart.plant.discount),
            stock: cart.plant.stock,
            images: cart.plant.images || []
        } : cart.plant_id,
        quantity: cart.quantity,
        pricing: {
            priceWithoutDiscount: Number(cart.priceWithoutDiscount),
            priceAfterDiscount: Number(cart.priceAfterDiscount),
            discount: Number(cart.discount),
            discountPrice: Number(cart.discountPrice)
        },
        addedAt: cart.addedAt
    };
};

exports.addToCart = async (req, res, next) => {
    try {
        const payload = {
            user_id: req.body.user || req.user,
            nursery_id: req.body.nursery,
            plant_id: req.body.plant,
            quantity: req.body.quantity,
            priceWithoutDiscount: req.body.pricing?.priceWithoutDiscount ?? req.body.priceWithoutDiscount,
            priceAfterDiscount: req.body.pricing?.priceAfterDiscount ?? req.body.priceAfterDiscount,
            discount: req.body.pricing?.discount ?? req.body.discount,
            discountPrice: req.body.pricing?.discountPrice ?? req.body.discountPrice,
            addedAt: req.body.addedAt
        };

        const created = await cartModel.create(payload);
        const result = await cartModel.findByPk(created.id, { include: cartInclude });

        const info = {
            status: true,
            message: "Product added to cart",
            result: toLegacyCart(result)
        };

        res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
};


exports.getCartItems = async (req, res, next) => {
    try {
        const result = await cartModel.findAll({
            where: { user_id: req.user },
            include: cartInclude
        });

        if (!result || result.length === 0) {
            const error = new Error("No Results Found");
            error.statusCode = 404;
            throw error;
        }
        const info = {
            status: true,
            message: "List of cart items.",
            result: result.map(toLegacyCart)
        };

        res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
};


exports.getCartItemById = async (req, res, next) => {
    try {
        const result = await cartModel.findOne({
            where: { id: req.params.id, user_id: req.user },
            include: cartInclude
        });

        if (!result) {
            const error = new Error("No Results Found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Cart with id retrieved successfully",
            result: toLegacyCart(result)
        };
        res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
};

exports.updateCartItemById = async (req, res, next) => {
    try {
        const updates = {};

        if (req.body.quantity !== undefined) updates.quantity = req.body.quantity;
        if (req.body.pricing?.priceWithoutDiscount !== undefined || req.body.priceWithoutDiscount !== undefined) {
            updates.priceWithoutDiscount = req.body.pricing?.priceWithoutDiscount ?? req.body.priceWithoutDiscount;
        }
        if (req.body.pricing?.priceAfterDiscount !== undefined || req.body.priceAfterDiscount !== undefined) {
            updates.priceAfterDiscount = req.body.pricing?.priceAfterDiscount ?? req.body.priceAfterDiscount;
        }
        if (req.body.pricing?.discount !== undefined || req.body.discount !== undefined) {
            updates.discount = req.body.pricing?.discount ?? req.body.discount;
        }
        if (req.body.pricing?.discountPrice !== undefined || req.body.discountPrice !== undefined) {
            updates.discountPrice = req.body.pricing?.discountPrice ?? req.body.discountPrice;
        }

        await cartModel.update(updates, { where: { id: req.params.id, user_id: req.user } });
        const result = await cartModel.findOne({
            where: { id: req.params.id, user_id: req.user },
            include: cartInclude
        });

        if (!result) {
            const error = new Error("No Results Found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Cart Edited successfully",
            result: toLegacyCart(result)
        };
        res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
};

exports.deleteCartItemById = async (req, res, next) => {
    try {
        const result = await cartModel.findOne({ where: { id: req.params.id, user_id: req.user }, include: cartInclude });

        if (result) {
            await result.destroy();
        }

        if (!result) {
            const error = new Error("No Results Found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Cart Deleted successfully",
            result: toLegacyCart(result)
        };
        res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
};


exports.isPlantAddedToCart = async (req, res, next) => {
    try {
        const plantId = req.params.plantId;
        const result = await cartModel.findOne({ where: { user_id: req.user, plant_id: plantId }, include: cartInclude });

        if (!result) {
            const error = new Error("No Results Found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Product is in the cart.",
            result: toLegacyCart(result)
        };
        res.status(200).send(info);

    } catch (error) {
        next(error); //! Pass the error to the global error middleware
    }
};