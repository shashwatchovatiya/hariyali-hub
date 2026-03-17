const KV = require('../model/kvModel');
const { Op } = require('sequelize');

async function getData(userId, orderToken, key) {
    try {
        const uId = String(userId);
        const token = String(orderToken);
        
        console.log(`[KV GET] Searching for: userId=${uId}, token=${token}, key=${key}`);
        const result = await KV.findOne({
            where: {
                userId: uId,
                token,
                key,
                expireAt: { [Op.gt]: new Date() }
            }
        });
        
        if (!result) {
            console.log(`[KV GET] Result NOT found`);
            return null;
        }
        console.log(`[KV GET] Result found:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`Error fetching data from MongoDB KV: ${error.message}`);
        return null;
    }
}

async function setData(userId, token, key, data, expire) {
    try {
        const uId = String(userId);
        const tkn = String(token);
        
        // expire is in seconds. Default to 30 days if not provided.
        const seconds = expire || 2592000;
        const expireAt = new Date(Date.now() + seconds * 1000);
        
        console.log(`[KV SET] Saving: userId=${uId}, token=${tkn}, key=${key}, expireAt=${expireAt}`);
        
        const existing = await KV.findOne({ where: { userId: uId, token: tkn, key } });

        if (existing) {
            await existing.update({ data, expireAt });
        } else {
            await KV.create({ userId: uId, token: tkn, key, data, expireAt });
        }
        console.log(`[KV SET] Save successful`);
    } catch (error) {
        console.error(`Error setting data in MongoDB KV: ${error.message}`);
    }
}

async function deleteData(userId, token, key) {
    try {
        const uId = String(userId);
        const tkn = String(token);
        
        console.log(`[KV DELETE] userId=${uId}, token=${tkn}, key=${key}`);
        await KV.destroy({ where: { userId: uId, token: tkn, key } });
    } catch (error) {
        console.error(`Error deleting data from MongoDB KV: ${error.message}`);
    }
}

module.exports = { getData, deleteData, setData };