import express from "express";
import cors, { type CorsOptions } from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.API_PORT || 3000;
const WHITELIST = process.env.API_WHITELIST?.split(",") || [];

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

app.get("/health", (_req, res) => {
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
