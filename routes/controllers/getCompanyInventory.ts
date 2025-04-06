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

		const sortMap: Record<string, string> = {
			inventory_uuid: "inventory.uuid",
			inventory_name: "inventory.name",
			quantity: "company_inventory.quantity",
			company_price: "company_inventory.company_price",
		};

		const allowedOrderValues = ["asc", "desc"];
		const rawSort = req.query.sort as string;
		const sort = sortMap[rawSort] || "inventory.uuid";
		const order = allowedOrderValues.includes((req.query.order as string)?.toLowerCase())
			? (req.query.order as string).toLowerCase()
			: "asc";

		const countQuery = `
      SELECT COUNT(*) FROM company_inventory WHERE company_uuid = $1
    `;
		const countResult = await pool.query(countQuery, [companyUuid]);
		const totalCount = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count, 10) : 0;

		const query = `
      SELECT
        inventory.uuid AS inventory_uuid,
        inventory.name AS inventory_name,
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
