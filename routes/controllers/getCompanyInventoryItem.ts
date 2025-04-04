import { type Request, type Response } from "express";
import pool from "../../config/database.ts";

export default async (req: Request, res: Response) => {
	const companyUuid = req.params.companyUuid;
	const inventoryUuid = req.params.inventoryUuid;

	if (!companyUuid) {
		return res.status(400).json({ error: "Invalid company UUID" });
	}

	if (!inventoryUuid) {
		return res.status(400).json({ error: "Invalid inventory UUID" });
	}
	try {
		const postgres = `
		SELECT
			inventory.uuid,
			inventory.name,
			inventory.description,
			inventory.base_price,
			company_inventory.quantity,
			company_inventory.company_price
		  FROM
			company_inventory
		  JOIN
			inventory ON company_inventory.inventory_uuid = inventory.uuid
		  WHERE
			company_inventory.company_uuid = $1
			AND company_inventory.inventory_uuid = $2
		`;

		const { rows } = await pool.query(postgres, [companyUuid, inventoryUuid]);

		return res.json(rows);
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
