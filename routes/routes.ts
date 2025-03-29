import { Router } from "express";
import userRoutes from "./userRoutes.ts";
import registerUser from "./controllers/registerUser.ts";

const apiRoutes = Router();

apiRoutes.use("/users", userRoutes);

apiRoutes.route("/register").post(registerUser);

apiRoutes.route("/login").post();

export default apiRoutes;
