const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// photo is a base64 data URI string, e.g. "data:image/jpeg;base64,..."
// returns the uploaded image's secure (https) URL
const uploadPhoto = async (photo) => {
  const result = await cloudinary.uploader.upload(photo, {
    folder: process.env.CLOUDINARY_FOLDER_NAME || "SolarConnect",
  });
  return result.secure_url;
};

module.exports = { uploadPhoto };
