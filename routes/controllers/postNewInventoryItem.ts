import { type Request, type Response } from "express";
import pool from "../../config/database.ts";
import { v4 as uuidv4 } from "uuid";

export default async (req: Request, res: Response) => {
	try {
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			const { name, description, base_price, company_uuid, quantity, company_price } = req.body;

			if (!name || base_price === undefined) {
				return res.status(400).json({ error: "Name and base_price are required" });
			}

			let inventoryUuid;
			let inventoryItem;

			const checkInventoryQuery = `
        SELECT id, uuid, name, description, base_price FROM inventory WHERE name = $1
      `;

			const inventoryCheck = await client.query(checkInventoryQuery, [name]);

			if (inventoryCheck.rows.length > 0) {
				inventoryItem = inventoryCheck.rows[0];
				inventoryUuid = inventoryItem.uuid;
			} else {
				inventoryUuid = uuidv4();
				const inventoryQuery = `
          INSERT INTO inventory (uuid, name, description, base_price)
          VALUES ($1, $2, $3, $4)
          RETURNING id, uuid, name, description, base_price
        `;

				const inventoryResult = await client.query(inventoryQuery, [
					inventoryUuid,
					name,
					description || null,
					base_price,
				]);

				inventoryItem = inventoryResult.rows[0];
			}

			if (company_uuid) {
				const checkCompanyInventoryQuery = `
          SELECT * FROM company_inventory 
          WHERE company_uuid = $1 AND inventory_uuid = $2
        `;

				const companyInventoryCheck = await client.query(checkCompanyInventoryQuery, [
					company_uuid,
					inventoryUuid,
				]);

				if (companyInventoryCheck.rows.length > 0) {
					const updateQuery = `
            UPDATE company_inventory
            SET quantity = $1, company_price = $2
            WHERE company_uuid = $3 AND inventory_uuid = $4
          `;

					await client.query(updateQuery, [
						quantity || companyInventoryCheck.rows[0].quantity,
						company_price || companyInventoryCheck.rows[0].company_price,
						company_uuid,
						inventoryUuid,
					]);
				} else {
					const companyInventoryQuery = `
            INSERT INTO company_inventory (company_uuid, inventory_uuid, quantity, company_price)
            VALUES ($1, $2, $3, $4)
          `;

					await client.query(companyInventoryQuery, [
						company_uuid,
						inventoryUuid,
						quantity || 0,
						company_price || base_price,
					]);
				}

				inventoryItem.company_uuid = company_uuid;
				inventoryItem.quantity = quantity || 0;
				inventoryItem.company_price = company_price || base_price;
			}

			await client.query("COMMIT");

			return res.status(201).json({
				message:
					inventoryCheck.rows.length > 0
						? "Inventory item linked to company successfully"
						: "Inventory item created and linked successfully",
				data: inventoryItem,
			});
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
