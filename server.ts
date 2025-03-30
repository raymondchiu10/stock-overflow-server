import express from "express";
import cors, { type CorsOptions } from "cors";
import "dotenv/config";

const app = express();

const PORT = process.env.DB_PORT || 8080;
const WHITELIST = process.env.DB_WHITELIST?.split(",") || [];

import registerUser from "./routes/controllers/registerUser.ts";
import logInUser from "./routes/controllers/loginUser.ts";
import userRoutes from "./routes/userRoutes.ts";
import { authenticateJWT } from "./auth/auth.ts";

const corsOptions: CorsOptions = {
	origin: (origin, callback) => {
		if (!origin || WHITELIST.includes(origin)) {
			callback(null, true);
		} else {
			callback(new Error("Not allowed by CORS"));
		}
	},
};

app.use(cors(corsOptions));
app.use(express.json());

app.route("/health").get((_req, res) => {
	res.sendStatus(200);
});

app.route("/sign-up").post(registerUser);

app.route("/log-in").post(logInUser);

app.use("/users", authenticateJWT, userRoutes);

app.use((err: any, _req: any, res: any, next: any) => {
	if (err.name === "UnauthorizedError") {
		return res.status(401).json({
			error: "Unauthorized",
			message: "Your session has expired or the token is invalid. Please log in again.",
		});
	}
	next(err);
});

app.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
