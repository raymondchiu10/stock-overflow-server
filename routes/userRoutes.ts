import { Router, type Response } from "express";
import pool from "../config/database.ts";
import type { AuthenticatedRequest } from "../auth/auth.ts";

const userRoutes = Router();

userRoutes.route("/profile").get(async (req: AuthenticatedRequest, res: Response) => {
	if (!req.user) {
		return res.status(401).json({ message: "User not authenticated for this route." });
	}

	console.log("User Profile Accessed:", req.user); // Logs user info
	return res.json(req.user); // Send user details from the DB
});

userRoutes.route("/:uuid").get(async (req: AuthenticatedRequest, res: Response) => {
	if (!req.user || req.user.role !== "admin") {
		return res.status(401).json({ message: "User not authenticated for this route." });
	}
	const { uuid } = req.params;
	const postgres = `SELECT * FROM users WHERE uuid = ($1)`;
	try {
		const { rows } = await pool.query(postgres, [uuid]);
		if (rows.length === 0) {
			return res.status(404).json({ message: "User not found" });
		}
		res.json({ user: rows[0] });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ message: "Internal server error" });
	}
});

export default userRoutes;
