import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../config/database.ts";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({ error: "All fields are required" });
	}

	try {
		const postgres = `SELECT * FROM users WHERE email = ($1)`;
		const { rowCount, rows } = await pool.query(postgres, [email]);

		if (rowCount === 0) {
			return res.status(409).json({ error: "User does not exist" });
		}

		if (!rows[0] || !(await bcrypt.compare(password, rows[0].password))) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const token = jwt.sign({ uuid: rows[0].uuid, role: rows[0].role }, SECRET_KEY, { expiresIn: "24h" });
		res.status(202).json({ token });
	} catch (err) {
		console.error(err);
		return res.status(500).json({ error: "Internal Server Error" });
	}
};
