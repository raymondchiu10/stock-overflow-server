import bcrypt from "bcryptjs";
import { Router, type Request, type Response } from "express";

const userRoutes = Router();

const users: { username: string; password: string }[] = [];

userRoutes.route("/register").post(async (req: Request, res: Response) => {
	const { username, password } = req.body;
	const hashedPassword = await bcrypt.hash(password, 10);
	users.push({ username, password: hashedPassword });
	res.json({ message: "User registered successfully!" });
});

export default userRoutes;
