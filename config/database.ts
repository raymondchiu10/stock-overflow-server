import pg from "pg";
import "dotenv/config";

console.log("process.env.DB_CONNECTION_STRING", process.env.DB_CONNECTION_STRING);

const pool = new pg.Pool({
	connectionString: process.env.DB_CONNECTION_STRING,
	ssl: false,
});

export default pool;
