import { Router, type Request, type Response } from "express";
import pool from "../config/database.ts";

const inventoryRoutes = Router();

inventoryRoutes.route("/").get(async (req: Request, res: Response) => {
	try {
		const page = Math.max(parseInt(req.query.page as string) || 1, 1);
		const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
		const offset = (page - 1) * limit;

		const companyUuid = (req.query.companyUuid as string) || null;

		const allowedSortColumns = [
			"inventory.id",
			"inventory.name",
			"inventory.base_price",
			"company_inventory.quantity",
			"company_inventory.company_price",
		];
		const allowedOrderValues = ["asc", "desc"];

		const sort = allowedSortColumns.includes(req.query.sort as string) ? req.query.sort : "inventory.id";
		const order = allowedOrderValues.includes(req.query.order as string) ? req.query.order : "asc";

		const whereClause = companyUuid ? "WHERE company_inventory.company_uuid = $3" : "";
		const queryParams = companyUuid ? [limit, offset, companyUuid] : [limit, offset];

		const countQuery = `
		SELECT COUNT(*) as total_count
		FROM inventory
		LEFT JOIN company_inventory ON inventory.uuid = company_inventory.inventory_uuid
		${whereClause}
	  `;

		const countResult = await pool.query(countQuery, companyUuid ? [companyUuid] : []);

		const totalCount = countResult.rows.length > 0 ? parseInt(countResult.rows[0].count, 10) : 0;

		const query = `
		SELECT 
		  inventory.id,
		  inventory.uuid,
		  inventory.name,
		  inventory.description,
		  inventory.base_price,
		  company_inventory.quantity,
		  company_inventory.company_price,
		  company_inventory.company_uuid
		FROM 
		  inventory
		LEFT JOIN 
		  company_inventory ON inventory.uuid = company_inventory.inventory_uuid
		${whereClause}
		ORDER BY ${sort} ${order} 
		LIMIT $1 OFFSET $2
	  `;

		const { rows } = await pool.query(query, queryParams);

		return res.json({ data: rows, total: totalCount, page, limit });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal Server Error" });
	}
});

export default inventoryRoutes;
