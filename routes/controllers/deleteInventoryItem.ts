import { type Request, type Response } from "express";
import pool from "../../config/database.ts";

export default async (req: Request, res: Response) => {
	const { inventoryUuid } = req.params;

	try {
		pool.query("BEGIN");
		const postgres = `DELETE FROM inventory WHERE uuid = $1 RETURNING *`;
		const result = await pool.query(postgres, [inventoryUuid]);

		if (result.rowCount === 0) {
			return res.status(404).json({ message: "Inventory item not found" });
		}

		await pool.query("COMMIT");

		return res.status(200).json({
			message: "Inventory item deleted successfully",
			deletedItem: result.rows[0],
		});
	} catch (err) {
		await pool.query("ROLLBACK");
		console.error("Error deleting inventory item:", err);
		return res.status(500).json({ message: "Internal Server Error" });
	}
};
