import { type Request, type Response } from "express";
import QRCode from "qrcode";

export default async (req: Request, res: Response) => {
	try {
		const { inventoryUuid } = req.params;
		const qrCodeImage = await QRCode.toDataURL(inventoryUuid);
		return res.send(qrCodeImage);
	} catch (err) {
		console.error("Error generating QR code:", err);
		return res.status(500).send("Internal Server Error");
	}
};
