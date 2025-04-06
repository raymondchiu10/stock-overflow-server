import { Router, type Request, type Response } from "express";
import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";
import crypto from "crypto";

const cloudinaryRoutes = Router();

cloudinary.config({
	cloud_name: process.env.DB_CLOUDINARY_CLOUD_NAME!,
	api_key: process.env.DB_CLOUDINARY_API_KEY!,
	api_secret: process.env.DB_CLOUDINARY_API_SECRET!,
});

interface SignatureResponse extends Partial<Response> {
	signature: string;
	timestamp: number;
	cloudName: string;
	apiKey: string;
}

cloudinaryRoutes
	.route("/signature")
	.post(async (_req: Request, res: Response<SignatureResponse | Record<string, string | number>>) => {
		try {
			const timestamp = Math.round(Date.now() / 1000);

			const paramsToSign = {
				timestamp,
				upload_preset: "stock-overflow",
				source: "uw",
			};

			const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.DB_CLOUDINARY_API_SECRET!);

			return res.json({
				signature,
				timestamp,
				apiKey: process.env.DB_CLOUDINARY_API_KEY as string,
				cloudName: process.env.DB_CLOUDINARY_CLOUD_NAME as string,
			});
		} catch (error) {
			console.error("Error generating signature:", error);
			return res.status(500).json({ error: "Upload signature failed" });
		}
	});

export default cloudinaryRoutes;
