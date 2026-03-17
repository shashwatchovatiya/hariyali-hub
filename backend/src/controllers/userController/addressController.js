const addressModel = require('../../model/userModel/address');

//* POST API 
//* ADD: New Shipping Address
exports.addAddress = async (req, res, next) => {
    try {
        if (req.body.setAsDefault) {
            await addressModel.update({
                setAsDefault: false
            }, {
                where: { user_id: req.user, setAsDefault: true }
            });
        }

        const newAddress = await addressModel.create({ ...req.body, user_id: req.user });

        const info = {
            status: true,
            message: "New Address Added Successfully",
            result: newAddress
        };
        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};

//? GET API
//* GET: List of addresses
exports.getAddressList = async (req, res, next) => {
    try {
        const result = await addressModel.findAll({ where: { user_id: req.user } });

        result.sort((a, b) => {
            if (a.setAsDefault === true) return -1;
            if (b.setAsDefault === true) return 1;
            return 0;
        })

        const info = {
            status: true,
            message: "List of addresses",
            result
        };
        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};

//? GET API
//* GET: Address By Id
exports.getAddressById = async (req, res, next) => {
    try {
        const address = await addressModel.findOne({ where: { id: req.params.id, user_id: req.user } });

        //! address not found
        if (!address) {
            const error = new Error("Address not found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Address retrieved successfully",
            result: address
        };

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};

//^ Update API
//* Update: Update address
exports.updateAddress = async (req, res, next) => {
    try {
        if (req.body.setAsDefault === true) {
            await addressModel.update({
                setAsDefault: false
            }, {
                where: { user_id: req.user, setAsDefault: true }
            });
        }

        await addressModel.update(req.body, {
            where: { id: req.params.id, user_id: req.user }
        });

        const result = await addressModel.findOne({ where: { id: req.params.id, user_id: req.user } });

        //! address not found
        if (!result) {
            const error = new Error("Address not found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Address updated successfully",
            result
        };

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};

//! Delete API
//* Delete: Address
exports.deleteAddress = async (req, res, next) => {
    try {
        const result = await addressModel.findOne({ where: { id: req.params.id, user_id: req.user } });

        if (result) {
            await result.destroy();
        }

        //! address not found
        if (!result) {
            const error = new Error("Address not found");
            error.statusCode = 404;
            throw error;
        }

        const info = {
            status: true,
            message: "Address deleted successfully",
            result
        };
        res.status(200).send(info);
    } catch (error) {
        next(error);
    }
};

//? GET API
//* Get: Default Address
exports.getDefaultAddress = async (req, res, next) => {
    try {
        const address = await addressModel.findAll({ where: { user_id: req.user } });

        //* Find default Address
        const defaultAddress = address.find(address => address.setAsDefault === true);

        const info = {
            status: true,
            message: "Default or last use address.",
            result: defaultAddress ? defaultAddress : address[address.length - 1] || [] //* if default address present else recent added address.
        }

        res.status(200).send(info);

    } catch (error) {
        next(error);
    }
};
