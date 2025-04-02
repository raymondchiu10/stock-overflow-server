import { Router, type Request, type Response } from "express";
import pool from "../config/database.ts";

const imageRoutes = Router();

imageRoutes.route("/company/:companyUuid/inventory").get(async (req: Request, res: Response) => {
	try {
		const companyUuid = req.params.companyUuid;

		if (!companyUuid) {
			return res.status(400).json({ error: "Company UUID is required" });
		}

		// Query to fetch all images associated with the company's inventory items
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
	  `;

		const { rows } = await pool.query(query, [companyUuid]);

		// If no images found
		if (rows.length === 0) {
			return res.status(404).json({ message: "No images found for this company's inventory" });
		}

		// Group images by inventory item for a more structured response
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

		// Convert the object to an array
		const result = Object.values(inventoryWithImages);

		return res.status(200).json(result);
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
      ) AS exists
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

export default imageRoutes;
