import { type Request, type Response } from "express";

import { Router } from "express";
import getCompanyInventory from "./controllers/getCompanyInventory.ts";
import postNewInventoryItem from "./controllers/postNewInventoryItem.ts";
import updateInventoryItem from "./controllers/updateInventoryItem.ts";
import deleteInventoryItem from "./controllers/deleteInventoryItem.ts";

const inventoryRoutes = Router();

inventoryRoutes.route("/").get(getCompanyInventory).post(postNewInventoryItem);
inventoryRoutes.route("/:inventoryUuid").patch(updateInventoryItem).delete(deleteInventoryItem);

export default inventoryRoutes;
