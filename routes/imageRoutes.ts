import { Router, type Request, type Response } from "express";
import pool from "../config/database.ts";
import { v4 as uuidv4 } from "uuid";
import { authenticateJWT } from "../auth/auth.ts";

const imageRoutes = Router();

imageRoutes.route("/company/:companyUuid/inventory").get(async (req: Request, res: Response) => {
	try {
		const companyUuid = req.params.companyUuid;
		const page = parseInt(req.query.page as string) || 1;
		const limit = parseInt(req.query.limit as string) || 10;
		const offset = (page - 1) * limit;

		if (!companyUuid) {
			return res.status(400).json({ error: "Company UUID is required" });
		}

		// Query to get total count (for pagination info)
		const countQuery = `
			SELECT COUNT(*)
			FROM company_inventory ci
			JOIN inventory inv ON ci.inventory_uuid = inv.uuid
			JOIN inventory_images ii ON inv.uuid = ii.inventory_uuid
			JOIN images i ON ii.image_uuid = i.uuid
			WHERE ci.company_uuid = $1
		`;
		const countResult = await pool.query(countQuery, [companyUuid]);
		const totalRecords = parseInt(countResult.rows[0].count);
		const totalPages = Math.ceil(totalRecords / limit);

		const query = `
		SELECT 
		  i.uuid AS image_uuid,
		  i.name AS image_name,
		  i.url AS image_url,
		  i.alt AS image_alt,
		  inv.uuid AS inventory_uuid,
		  inv.name AS inventory_name
		FROM 
		  company_inventory ci
		JOIN 
		  inventory inv ON ci.inventory_uuid = inv.uuid
		JOIN 
		  inventory_images ii ON inv.uuid = ii.inventory_uuid
		JOIN 
		  images i ON ii.image_uuid = i.uuid
		WHERE 
		  ci.company_uuid = $1
		ORDER BY 
		  inv.name, i.name
		LIMIT $2 OFFSET $3
	  `;

		const { rows } = await pool.query(query, [companyUuid, limit, offset]);

		if (rows.length === 0) {
			return res.status(404).json({ message: "No images found for this company's inventory" });
		}

		const inventoryWithImages = rows.reduce((acc, row) => {
			const inventoryUuid = row.inventory_uuid;

			if (!acc[inventoryUuid]) {
				acc[inventoryUuid] = {
					inventory_uuid: inventoryUuid,
					inventory_name: row.inventory_name,
					images: [],
				};
			}

			acc[inventoryUuid].images.push({
				uuid: row.image_uuid,
				name: row.image_name,
				url: row.image_url,
				alt: row.image_alt,
			});

			return acc;
		}, {});

		const result = Object.values(inventoryWithImages);

		return res.status(200).json({
			page,
			limit,
			totalPages,
			totalRecords,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching images:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

imageRoutes.route("/company/:companyUuid/inventory/:inventoryUuid").get(async (req: Request, res: Response) => {
	try {
		const { companyUuid, inventoryUuid } = req.params;

		if (!companyUuid || !inventoryUuid) {
			return res.status(400).json({ error: "Company UUID and Inventory UUID are required" });
		}

		const verifyQuery = `
		SELECT EXISTS (
          SELECT 1 
          FROM company_inventory 
          WHERE company_uuid = $1 AND inventory_uuid = $2
		)
		AS exists
		`;

		const verifyResult = await pool.query(verifyQuery, [companyUuid, inventoryUuid]);

		if (!verifyResult.rows[0].exists) {
			return res.status(404).json({
				error: "Inventory item not found for this company",
			});
		}

		const query = `
		SELECT 
		  i.uuid,
		  i.name,
		  i.url,
		  i.alt
		FROM 
		  images i
		JOIN 
		  inventory_images ii ON i.uuid = ii.image_uuid
		WHERE 
		  ii.inventory_uuid = $1
		ORDER BY 
		  i.name
    `;

		const { rows } = await pool.query(query, [inventoryUuid]);

		if (rows.length === 0) {
			return res.status(200).json({
				inventory_uuid: inventoryUuid,
				images: [],
			});
		}

		return res.status(200).json({
			inventory_uuid: inventoryUuid,
			images: rows,
		});
	} catch (error) {
		console.error("Error fetching images:", error);
		return res.status(500).json({ error: "Internal server error" });
	}
});

interface ImagePayload {
	url: string;
	name?: string;
	alt?: string;
	cloudinary?: Record<any, any>;
}

imageRoutes.route("/inventory/:inventoryUuid").post(authenticateJWT, async (req: Request, res: Response) => {
	try {
		const { inventoryUuid } = req.params;
		const { url, name, alt, cloudinary } = req.body as ImagePayload;

		if (!url || typeof url !== "string") {
			return res.status(400).json({ message: "A valid image URL is required." });
		}

		await pool.query("BEGIN");

		const inventoryCheckQuery = `SELECT 1 FROM inventory WHERE uuid = $1`;
		const inventoryCheck = await pool.query(inventoryCheckQuery, [inventoryUuid]);

		if (inventoryCheck.rowCount === 0) {
			await pool.query("ROLLBACK");
			return res.status(404).json({ message: "Inventory item not found." });
		}

		const imageUuid = uuidv4();
		const insertImageQuery = `
			INSERT INTO images (uuid, name, url, alt, cloudinary)
			VALUES ($1, $2, $3, $4, $5)
		`;

		await pool.query(insertImageQuery, [imageUuid, name || null, url, alt || null, cloudinary || null]);

		const insertRelationQuery = `
			INSERT INTO inventory_images (inventory_uuid, image_uuid)
			VALUES ($1, $2)
		`;
		await pool.query(insertRelationQuery, [inventoryUuid, imageUuid]);

		await pool.query("COMMIT");

		return res.status(201).json({
			success: true,
			message: "Image added to inventory successfully.",
			data: {
				imageUuid,
				inventoryUuid,
			},
		});
	} catch (err: any) {
		await pool.query("ROLLBACK");
		console.error("Error adding image to inventory:", err);

		if (err.code === "23503") {
			return res.status(404).json({ message: "Foreign key constraint failed." });
		}

		return res.status(500).json({ message: "Error adding image to inventory." });
	}
});

export default imageRoutes;
