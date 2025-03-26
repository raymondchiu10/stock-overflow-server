import express from "express";
import cors, { type CorsOptions } from "cors";
import "dotenv/config";
import userRoutes from "./routes/userRoutes.ts";
import pool from "./config/database.ts";
const app = express();
const PORT = 3000;
const WHITELIST = process.env.DB_WHITELIST?.split(",") || [];

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

app.use("/users", userRoutes);

app.get("/health", (_req, res) => {
  res.sendStatus(200);
});

app.get("/items", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM items ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
