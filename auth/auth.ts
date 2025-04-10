import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database.ts";

const SECRET_KEY = process.env.DB_JWT_SECRET || "your_secret_key";

export interface AuthenticatedRequest extends Request {
	user?: any; // TODO: Define a proper user type
}

// export const authenticateJWT = jwtMiddleware({ secret: SECRET_KEY, algorithms: ["HS256"] });

export const authenticateJWT = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, SECRET_KEY) as { uuid: string };

		const { rows } = await pool.query("SELECT * FROM users WHERE uuid = $1", [decoded.uuid]);

		if (!rows.length) {
			return res.status(401).json({ message: "Invalid token" });
		}

		req.user = rows[0];
		next();
	} catch (err) {
		console.error(err);
		return res.status(403).json({ message: "Forbidden" });
	}
};
