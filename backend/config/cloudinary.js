const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = async (file, folder = 'school-erp') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: 'auto',
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(new Error('Error uploading to Cloudinary: ' + error.message));
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    // Write the file buffer to the stream
    uploadStream.end(file.buffer);
  });
};

const deleteFromCloudinary = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    throw new Error('Error deleting from Cloudinary: ' + error.message);
  }
};

module.exports = { uploadToCloudinary, deleteFromCloudinary };
