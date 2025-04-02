import express from "express";
import cloudinary from "cloudinary";
import "dotenv/config";

const uploadRoutes = express.Router();

cloudinary.v2.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

uploadRoutes.post("/upload", async (req, res) => {
	try {
		const { data } = req.body;

		const uploadResponse = await cloudinary.v2.uploader.upload(data, {
			folder: "next-app",
		});

		res.json({
			success: true,
			url: uploadResponse.secure_url,
			public_id: uploadResponse.public_id,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Upload failed" });
	}
});

export default uploadRoutes;
