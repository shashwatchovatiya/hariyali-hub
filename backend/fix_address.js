
const mongoose = require('mongoose');
const addressModel = require('d:/Manav-Mitali-Diya-project/Plant-Selling-Website/backend/src/model/userModel/address.js');

const DB = "mongodb://127.0.0.1:27017/plantdb";

async function run() {
    try {
        await mongoose.connect(DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to DB");

        const data = {
            "user": "69b52c07005705dbc36853d6",
            "name": "Shashwat Chovatiya",
            "phone": "8866187676",
            "pinCode": "380049",
            "address": "B-503, Divyajivan Elegance, Nikol Gam Rd, opp. Vrundavan Farm, Jivanvadi, Nicol Gam, Nikol,",
            "landmark": "Nikol",
            "city": "Ahmedabad",
            "state": "Gujarat",
            "setAsDefault": true
        };

        const newAddress = new addressModel(data);
        await newAddress.save();
        console.log("Address added successfully:", newAddress);
        process.exit(0);
    } catch (error) {
        console.error("Error adding address:", error);
        process.exit(1);
    }
}

run();
