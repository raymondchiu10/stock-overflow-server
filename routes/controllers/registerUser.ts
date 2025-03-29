import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../config/database.ts";

export default async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({ error: "All fields are required" });
	}

	try {
		const postgres = `INSERT INTO users (email, password) VALUES 
		($1, $2)
		ON CONFLICT (email) DO NOTHING;`;

		const hashedPassword = await bcrypt.hash(password, 10);
		const { rowCount } = await pool.query(postgres, [email, hashedPassword]);

		if (rowCount && rowCount === 0) {
			return res.status(409).json({ error: "User already exists" });
		}

		return res.json({ message: "User registered successfully!" });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
