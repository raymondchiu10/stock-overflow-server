import { type Request, type Response } from "express";

import { Router } from "express";
import getCompanyInventory from "./controllers/getCompanyInventory.ts";
import postNewInventoryItem from "./controllers/postNewInventoryItem.ts";
import updateInventoryItem from "./controllers/updateInventoryItem.ts";

const inventoryRoutes = Router();

inventoryRoutes.route("/").get(getCompanyInventory).post(postNewInventoryItem);
inventoryRoutes.route("/:inventoryUuid").patch(updateInventoryItem);

export default inventoryRoutes;
