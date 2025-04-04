import { type Request, type Response } from "express";
import pool from "../../config/database.ts";

export default async (req: Request, res: Response) => {
	try {
		const { inventoryUuid } = req.params;
		const { name, description, base_price, company_uuid, quantity, company_price } = req.body;

		if (!inventoryUuid) {
			return res.status(400).json({ error: "Inventory UUID is required" });
		}

		// Start a transaction
		const client = await pool.connect();

		try {
			await client.query("BEGIN");

			// Check if inventory item exists
			const checkInventoryQuery = `
        SELECT * FROM inventory WHERE uuid = $1
      `;

			const inventoryCheck = await client.query(checkInventoryQuery, [inventoryUuid]);

			if (inventoryCheck.rows.length === 0) {
				return res.status(404).json({ error: "Inventory item not found" });
			}

			// Update core inventory data if provided
			if (name || description !== undefined || base_price !== undefined) {
				const updateFields = [];
				const updateValues = [];
				let paramCounter = 1;

				if (name) {
					updateFields.push(`name = $${paramCounter}`);
					updateValues.push(name);
					paramCounter++;
				}

				if (description !== undefined) {
					updateFields.push(`description = $${paramCounter}`);
					updateValues.push(description);
					paramCounter++;
				}

				if (base_price !== undefined) {
					updateFields.push(`base_price = $${paramCounter}`);
					updateValues.push(base_price);
					paramCounter++;
				}

				if (updateFields.length > 0) {
					updateValues.push(inventoryUuid);
					const updateInventoryQuery = `
            UPDATE inventory 
            SET ${updateFields.join(", ")} 
            WHERE uuid = $${paramCounter}
            RETURNING id, uuid, name, description, base_price
          `;

					await client.query(updateInventoryQuery, updateValues);
				}
			}

			// Handle company-specific data if company_uuid is provided
			let companyInventoryResult = null;
			if (company_uuid) {
				// Check if the company-inventory association exists
				const checkCompanyInventoryQuery = `
          SELECT * FROM company_inventory 
          WHERE company_uuid = $1 AND inventory_uuid = $2
        `;

				const companyInventoryCheck = await client.query(checkCompanyInventoryQuery, [
					company_uuid,
					inventoryUuid,
				]);

				if (companyInventoryCheck.rows.length > 0) {
					// Update existing association
					const updateFields = [];
					const updateValues = [];
					let paramCounter = 1;

					if (quantity !== undefined) {
						updateFields.push(`quantity = $${paramCounter}`);
						updateValues.push(quantity);
						paramCounter++;
					}

					if (company_price !== undefined) {
						updateFields.push(`company_price = $${paramCounter}`);
						updateValues.push(company_price);
						paramCounter++;
					}

					if (updateFields.length > 0) {
						updateValues.push(company_uuid, inventoryUuid);
						const updateCompanyInventoryQuery = `
              UPDATE company_inventory 
              SET ${updateFields.join(", ")} 
              WHERE company_uuid = $${paramCounter} AND inventory_uuid = $${paramCounter + 1}
              RETURNING *
            `;

						companyInventoryResult = await client.query(updateCompanyInventoryQuery, updateValues);
					}
				} else {
					// Create new association
					const createCompanyInventoryQuery = `
            INSERT INTO company_inventory (company_uuid, inventory_uuid, quantity, company_price)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `;

					// Get the base_price for default if company_price is not provided
					const base_price_current = inventoryCheck.rows[0].base_price;

					companyInventoryResult = await client.query(createCompanyInventoryQuery, [
						company_uuid,
						inventoryUuid,
						quantity || 0,
						company_price || base_price_current,
					]);
				}
			}

			// Get the updated inventory item with company info if applicable
			const getUpdatedQuery = `
        SELECT 
          i.id,
          i.uuid,
          i.name,
          i.description,
          i.base_price,
          ci.quantity,
          ci.company_price,
          ci.company_uuid
        FROM 
          inventory i
        LEFT JOIN 
          company_inventory ci ON i.uuid = ci.inventory_uuid
        WHERE 
          i.uuid = $1
          ${company_uuid ? "AND ci.company_uuid = $2" : ""}
      `;

			const queryParams = company_uuid ? [inventoryUuid, company_uuid] : [inventoryUuid];
			const updatedItem = await client.query(getUpdatedQuery, queryParams);

			await client.query("COMMIT");

			return res.json({
				message: "Inventory item updated successfully",
				data: updatedItem.rows[0],
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
