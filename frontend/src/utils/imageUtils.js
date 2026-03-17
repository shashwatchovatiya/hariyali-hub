// utils/imageUtils.js

export const IMAGE_PLACEHOLDER_URL = "https://www.sainursery.com.au/front/ai.png";

/**
 * Transform an image URL by adding Cloudinary transformation parameters.
 * @param {string} url - The original Cloudinary image URL.
 * @param {number} width - The desired width of the image (default is 650).
 * @param {number} height - The desired height of the image (default is 550).
 * @param {string} transformation - Additional Cloudinary transformations (optional).
 * @returns {string} - The transformed Cloudinary image URL.
 */

export const transformImageUrl = (
  url,
  width = 650,
  height = 550,
  transformation = 'c_fill,g_auto'
) => {
  // ✅ Safety check
  if (!url || !url.includes('/image/upload/')) {
    return url || IMAGE_PLACEHOLDER_URL;
  }

  try {
    const parts = url.split('/image/upload/');

    if (parts.length < 2) return url;

    const baseUrl = parts[0];
    const filePath = parts[1];

    const transformationString = `w_${width},h_${height},${transformation}`;

    return `${baseUrl}/image/upload/${transformationString}/${filePath}`;
  } catch (error) {
    console.log("Image transform error:", error);
    return url;
  }
};