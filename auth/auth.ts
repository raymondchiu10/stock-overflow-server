import { expressjwt as jwtMiddleware } from "express-jwt";
const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key";

export const authenticateJWT = jwtMiddleware({ secret: SECRET_KEY, algorithms: ["HS256"] });
