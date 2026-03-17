const NurseryStoreBlock = require('../../model/nurseryModel/nurseryStoreBlocks');
const NurseryStoreTab = require('../../model/nurseryModel/nurseryStoreTabs');
const NurseryStoreTemplate = require('../../model/nurseryModel/nurseryStoreTemplates');
const Nursery = require('../../model/nurseryModel/nursery');
const NurseryStoreContact = require('../../model/nurseryModel/nurseryStoreContact');

const toLegacyNursery = (nurseryInstance) => {
    const nursery = nurseryInstance.toJSON ? nurseryInstance.toJSON() : nurseryInstance;

    return {
        _id: nursery.id,
        nurseryName: nursery.nurseryName,
        avatar: {
            public_id: nursery.avatar_public_id || '',
            url: nursery.avatar_url || ''
        },
        cover: {
            public_id: nursery.cover_public_id || '',
            url: nursery.cover_url || ''
        },
        nurseryEmail: nursery.nurseryEmail,
        nurseryPhone: nursery.nurseryPhone,
        address: nursery.address,
        pinCode: nursery.pinCode,
        city: nursery.city,
        state: nursery.state
    };
};

const toLegacyTab = (tabInstance) => {
    const tab = tabInstance.toJSON ? tabInstance.toJSON() : tabInstance;

    return {
        _id: tab.id,
        user: tab.user_id,
        nursery: tab.nursery_id,
        tabName: tab.tabName,
        status: tab.status,
        index: tab.index
    };
};

const toLegacyTemplate = (templateInstance) => {
    const template = templateInstance.toJSON ? templateInstance.toJSON() : templateInstance;

    return {
        _id: template.id,
        user: template.user_id,
        nursery: template.nursery_id,
        nurseryStoreTabs: template.nurseryStoreTabs_id,
        index: template.index,
        templateName: template.templateName
    };
};

const toLegacyBlock = (blockInstance) => {
    const block = blockInstance.toJSON ? blockInstance.toJSON() : blockInstance;

    return {
        _id: block.id,
        user: block.user_id,
        nursery: block.nursery_id,
        nurseryStoreTabs: block.nurseryStoreTabs_id,
        nurseryStoreTemplate: block.nurseryStoreTemplates_id,
        index: block.index,
        image: {
            public_id: block.image_public_id,
            url: block.image_url
        },
        isProduct: block.isProduct,
        url: block.url,
        title: block.title
    };
};

const toLegacyContact = (contactInstance) => {
    const contact = contactInstance.toJSON ? contactInstance.toJSON() : contactInstance;

    return {
        _id: contact.id,
        nursery: contact.nursery_id,
        user: contact.user_id,
        name: contact.name,
        email: contact.email,
        message: contact.message,
        isMessageViewed: contact.isMessageViewed,
        createdAt: contact.createdAt
    };
};

exports.getNurseryDetail = async function (req, res, next) {
    try {
        const id = req.params.id;

        if (!id) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        const nurseryDetails = await Nursery.findByPk(id);

        if (!nurseryDetails) {
            const error = new Error('No Data Found');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).send({
            status: true,
            message: 'Nursery Store Detail',
            result: toLegacyNursery(nurseryDetails)
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllTabsNurseryStorePublicView = async function (req, res, next) {
    try {
        const id = req.params.id;

        if (!id) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        const nurseryTabs = await NurseryStoreTab.findAll({ where: { nursery_id: id, status: 'publish' } });

        res.status(200).send({
            status: true,
            message: 'Nursery Store Tab Data',
            result: nurseryTabs.map(toLegacyTab)
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllTemplatesNurseryStorePublicView = async function (req, res, next) {
    try {
        const { nurseryId, tabId } = req.params;

        if (!nurseryId) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        const nurseryTab = await NurseryStoreTab.findOne({
            where: { id: tabId, nursery_id: nurseryId, status: 'publish' }
        });

        if (!nurseryTab || nurseryTab.status !== 'publish') {
            const error = new Error('No Data Found');
            error.statusCode = 404;
            throw error;
        }

        const nurseryTemplates = await NurseryStoreTemplate.findAll({ where: { nursery_id: nurseryId } });

        res.status(200).send({
            status: true,
            message: 'Nursery Store Template Data',
            result: nurseryTemplates.map(toLegacyTemplate)
        });

    } catch (error) {
        next(error);
    }
};

exports.getAllBlocksNurseryStorePublicView = async function (req, res, next) {
    try {
        const { nurseryId, tabId } = req.params;

        if (!nurseryId) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        const nurseryTab = await NurseryStoreTab.findOne({
            where: { id: tabId, nursery_id: nurseryId, status: 'publish' }
        });

        if (!nurseryTab || nurseryTab.status !== 'publish') {
            const error = new Error('No Data Found');
            error.statusCode = 404;
            throw error;
        }

        const nurseryBlocks = await NurseryStoreBlock.findAll({ where: { nursery_id: nurseryId } });

        res.status(200).send({
            status: true,
            message: 'Nursery Store Blocks Data',
            result: nurseryBlocks.map(toLegacyBlock)
        });

    } catch (error) {
        next(error);
    }
};

exports.nurseryStoreContactUs = async function (req, res, next) {
    try {
        const id = req.params.id;
        const { name, email, message, user } = req.body;

        if (!id) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        await NurseryStoreContact.create({
            name,
            email,
            message,
            user_id: user || null,
            nursery_id: id
        });

        res.status(201).send({
            status: true,
            message: 'Thank you for contacting nursery'
        });

    } catch (error) {
        next(error);
    }
};

exports.getNurseryStoreMessage = async function (req, res, next) {
    try {
        const id = req.params.id;

        if (!id) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        const nurseryStoreContactUs = await NurseryStoreContact.findAll({ where: { nursery_id: id } });

        res.status(200).send({
            status: true,
            message: 'Getting Nursery Store Message',
            nurseryMessage: nurseryStoreContactUs.map(toLegacyContact)
        });

    } catch (error) {
        next(error);
    }
};

exports.NurseryStoreMessageMarkAsViewed = async function (req, res, next) {
    try {
        const id = req.params.nurseryId;
        const messageId = req.params.messageId;

        if (!id) {
            const error = new Error('Incorrect Routes: Nursery Public Store Id is required');
            error.statusCode = 404;
            throw error;
        }

        await NurseryStoreContact.update({ isMessageViewed: true }, {
            where: { nursery_id: id, id: messageId }
        });

        const nurseryMessage = await NurseryStoreContact.findOne({
            where: { nursery_id: id, id: messageId }
        });

        res.status(200).send({
            status: true,
            message: 'Getting Nursery Store Message',
            nurseryMessage: toLegacyContact(nurseryMessage)
        });

    } catch (error) {
        next(error);
    }
};
