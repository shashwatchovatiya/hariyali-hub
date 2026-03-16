const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const uploadImages = async (images, options) => {
    try {
        const uploadedImages = [];

        for (const image of images) {
            if (image) {
                const fileName = `${uuidv4()}${path.extname(image.name)}`;
                const filePath = path.join(uploadDir, fileName);
                
                await image.mv(filePath);
                
                uploadedImages.push({
                    public_id: fileName,
                    url: `/uploads/${fileName}`,
                    secure_url: `/uploads/${fileName}`
                });
            }
        }

        return uploadedImages;
    } catch (error) {
        console.log(error);
    }
}

const uploadImage = async (image, options) => {
    try {
        const fileName = `${uuidv4()}${path.extname(image.name)}`;
        const filePath = path.join(uploadDir, fileName);
        
        await image.mv(filePath);
        
        return {
            public_id: fileName,
            url: `/uploads/${fileName}`,
            secure_url: `/uploads/${fileName}`
        };
    } catch (error) {
        console.log(error);
    }
}


const deleteImages = async (images, options) => {
    try {
        for (const public_id of images) {
            const filePath = path.join(uploadDir, public_id);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        return { result: 'deleted' };
    } catch (error) {
        console.log(error);
    }
}

const deleteFolder = async (folderPath) => {
    // Local storage folder deletion logic if needed
    return { result: 'folder deletion not implemented for local' };
}

const deleteResourcesByPrefix = async (prefix, options) => {
    // Local search and delete logic
    return { result: 'prefix deletion not implemented for local' };
}

module.exports = { uploadImages, uploadImage, deleteImages, deleteFolder, deleteResourcesByPrefix };