import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'


cloudinary.config({ 
  cloud_name: "krushnasakhare", 
  api_key: "677766355828698", 
  api_secret: "loLfrHqNJNKMrncBF1xno-jDvxk"
});


export const uploadOnCloudinary = async (filepath) => {
  try {
    if (!filepath) {
      throw new Error("No file path provided");
    }

    const resonse = await cloudinary.uploader.upload(filepath, {
      resource_type: 'auto',
      folder: 'Vegitable-freshPick',
    })

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath)
    }
    
    return resonse

  } catch (error) {
    console.error("Error uploading to Cloudinary", error);
      if (filepath && filepath && fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
    }
  return null;
  }
}