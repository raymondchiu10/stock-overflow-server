import { type Request, type Response } from "express";
import pool from "../../config/database.ts";

export default async (req: Request, res: Response) => {
	try {
		const companyUuid = req.params.companyUuid;

		if (!companyUuid) {
			return res.status(400).json({ error: "Invalid company ID" });
		}

		const page = Math.max(parseInt(req.query.page as string) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
		const offset = (page - 1) * limit;

		// Allowed columns for sorting
		const allowedSortColumns = [
			"inventory.id",
			"inventory.name",
			"company_inventory.quantity",
			"company_inventory.company_price",
		];
		const allowedOrderValues = ["asc", "desc"];

		const sort = allowedSortColumns.includes(req.query.sort as string) ? req.query.sort : "inventory.uuid";
		const order = allowedOrderValues.includes(req.query.order as string) ? req.query.order : "asc";

		// Get total count of records for this company
		const countQuery = `
      SELECT COUNT(*)
      FROM company_inventory
      WHERE company_uuid = $1
    `;
		const countResult = await pool.query(countQuery, [companyUuid]);
		const totalCount = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count, 10) : 0;

		// Fetch inventory data for the specific company with pagination
		const query = `
      SELECT
        inventory.uuid,
        inventory.name,
        inventory.description,
        inventory.base_price,
	  	company_inventory.company_uuid,
        company_inventory.quantity,
        company_inventory.company_price
      FROM
        company_inventory
      JOIN
        inventory ON company_inventory.inventory_uuid = inventory.uuid
      WHERE
        company_inventory.company_uuid = $1
      ORDER BY
        ${sort} ${order}
      LIMIT $2 OFFSET $3
    `;

		const { rows } = await pool.query(query, [companyUuid, limit, offset]);

		return res.json({
			data: rows,
			total: totalCount,
			page,
			limit,
		});
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
