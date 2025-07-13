import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect the file type
    });

    // File has been uploaded successfully, now remove the local temp file
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // If the upload fails, still remove the local temp file
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return null;
  }
};

const deleteOnCloudinary = async (publicId, resourceType = "image") => {
  if (!publicId) return null;
  try {
    // Delete the file from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.log("Error deleting from Cloudinary", error);
    return null;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
