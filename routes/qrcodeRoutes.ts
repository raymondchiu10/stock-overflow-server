import { type Request, type Response } from "express";

import { Router } from "express";
import getQrCode from "./controllers/getQrCode.ts";

const qrcodeRotues = Router();

qrcodeRotues.route("/:inventoryUuid").get(getQrCode);

export default qrcodeRotues;
