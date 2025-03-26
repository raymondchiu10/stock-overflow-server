import { Router, type Request, type Response } from "express";

const userRoutes = Router();

userRoutes.route("/").post().get();

export default userRoutes;
