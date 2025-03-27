import pg from "pg";
import "dotenv/config";

const pool = new pg.Pool({
	connectionString: process.env.DB_CONNECTION_STRING,
	ssl: false,
});

export default pool;
