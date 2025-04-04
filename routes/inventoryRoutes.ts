import { type Request, type Response } from "express";

import { Router } from "express";
import getCompanyInventory from "./controllers/getCompanyInventory.ts";
import postNewInventoryItem from "./controllers/postNewInventoryItem.ts";

const inventoryRoutes = Router();

inventoryRoutes.route("/").get(getCompanyInventory).post(postNewInventoryItem);

export default inventoryRoutes;
