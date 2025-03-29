import { type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import pool from "../../config/database.ts";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export default async (req: Request, res: Response) => {
	const { email, password } = req.body;

	if (!email || !password) {
		return res.status(400).send({ error: "All fields are required" });
	}

	const postgres = `SELECT * FROM users WHERE email = ($1)`;
	const { rowCount, rows } = await pool.query(postgres, [email]);

	if (rowCount === 0) {
		return res.status(409).json({ error: "User does not exist" });
	}

	if (!rows[0] || !(await bcrypt.compare(password, rows[0].password))) {
		return res.status(401).json({ message: "Invalid credentials" });
	}

	const token = jwt.sign({ username: rows[0].email }, SECRET_KEY, { expiresIn: "24h" });
	res.json({ token });
};
