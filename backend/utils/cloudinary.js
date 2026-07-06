import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        });

        // remove from local server storage
        fs.unlink(localFilePath);
        return response;
    } catch (error) {
        if(fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);  // unlink -> delete, sync-> delete the file then only proceed

        console.error("Cloudinary upload failed, local file cleaned up: ",error)
        return null;
    }
}

export {uploadOnCloudinary};