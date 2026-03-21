require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// Configure these
const REMOTE_URI = process.argv[2]; // Pass as argument: node migrate.js "remote_uri"
const LOCAL_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plantdb";
const UPLOAD_DIR = path.join(__dirname, 'public/uploads');

if (!REMOTE_URI) {
    console.error("Please provide the remote MongoDB URI as an argument.");
    console.error("Usage: node migrate.js <REMOTE_MONGODB_URI>");
    process.exit(1);
}

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function downloadImage(url) {
    try {
        const fileName = `${uuidv4()}${path.extname(url.split('?')[0]) || '.jpg'}`;
        const filePath = path.join(UPLOAD_DIR, fileName);
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(fileName));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Failed to download image from ${url}: ${error.message}`);
        return null;
    }
}

async function migrate() {
    console.log("Starting migration...");

    const remoteConn = await mongoose.createConnection(REMOTE_URI).asPromise();
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();

    console.log("Connected to both databases.");

    const collections = await remoteConn.db.listCollections().toArray();

    for (const colInfo of collections) {
        const collectionName = colInfo.name;
        console.log(`Migrating collection: ${collectionName}`);

        const remoteCol = remoteConn.collection(collectionName);
        const localCol = localConn.collection(collectionName);

        const data = await remoteCol.find({}).toArray();

        if (data.length === 0) {
            console.log(`Collection ${collectionName} is empty.`);
            continue;
        }

        // Processing images for specific collections
        if (['plants', 'nurseries'].includes(collectionName)) {
            console.log(`Processing images for ${collectionName}...`);
            for (const doc of data) {
                // Update images in 'plants'
                if (doc.images && Array.isArray(doc.images)) {
                    for (const img of doc.images) {
                        if (img.url && img.url.includes('cloudinary')) {
                            const localFile = await downloadImage(img.url);
                            if (localFile) {
                                img.url = `/uploads/${localFile}`;
                                img.public_id = localFile;
                            }
                        }
                    }
                }
                // Handle imagesList if exists
                if (doc.imagesList && Array.isArray(doc.imagesList)) {
                    for (const img of doc.imagesList) {
                        if (img.url && img.url.includes('cloudinary')) {
                            const localFile = await downloadImage(img.url);
                            if (localFile) {
                                img.url = `/uploads/${localFile}`;
                                img.public_id = localFile;
                            }
                        }
                    }
                }
            }
        }

        // Clear local collection and insert new data
        await localCol.deleteMany({});
        await localCol.insertMany(data);
        console.log(`Migrated ${data.length} documents for ${collectionName}.`);
    }

    console.log("Migration completed successfully.");
    await remoteConn.close();
    await localConn.close();
    process.exit(0);
}

migrate().catch(err => {
    console.error("Migration failed:", err);
    process.exit(1);
});
