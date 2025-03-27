import { Router, type Request, type Response } from "express";
import pool from "../config/database.ts";
import userRoutes from "./userRoutes.ts";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

const apiRoutes = Router();

apiRoutes.use("/users", userRoutes);

apiRoutes.route("/register").post(async (req: Request, res: Response) => {
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
});

apiRoutes.route("/login").post(async (req, res) => {
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
});

export default apiRoutes;
