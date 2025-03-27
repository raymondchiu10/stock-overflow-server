import pool from "../config/database.ts";

interface Table {
	name: string;
	schema: string;
	seed?: string;
}

const tables: Table[] = [
	{
		name: "users",
		schema: `
		CREATE TABLE IF NOT EXISTS users (
		  id SERIAL PRIMARY KEY,
		  name VARCHAR(100),
		  email VARCHAR(100) UNIQUE NOT NULL,
		  password VARCHAR(255) NOT NULL,
		  isAdmin BOOLEAN DEFAULT FALSE,
		  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		);`,
		seed: `
		INSERT INTO users (name, email, password, isAdmin) VALUES
		  ('ADMIN', 'admin@test.test', '$2b$10$0hkUO0Whbejoetr/gYsV0urTCxTdQG9fEe0r.tN8cwE1sKHRW1MIy', true),
		  ('NOT ADMIN', 'client@test.test', '$2b$10$0hkUO0Whbejoetr/gYsV0urTCxTdQG9fEe0r.tN8cwE1sKHRW1MIy', false)
		ON CONFLICT (email) DO NOTHING;`,
	},
	{
		name: "company",
		schema: `
		CREATE TABLE IF NOT EXISTS company (
		  id SERIAL PRIMARY KEY,
		  name VARCHAR(100) UNIQUE NOT NULL,
		  isActive BOOLEAN DEFAULT TRUE
		);`,
		seed: `
		INSERT INTO company (name, isActive) VALUES
		  ('Landscaping Company', true),
		  ('Pants Company', false)
		ON CONFLICT (name) DO NOTHING;`,
	},
	{
		name: "inventory",
		schema: `
		CREATE TABLE IF NOT EXISTS inventory (
		  id SERIAL PRIMARY KEY,
		  name VARCHAR(100) UNIQUE NOT NULL,
		  description VARCHAR(255),
		  base_price DECIMAL(10, 2) NOT NULL
		);`,
		seed: `
		INSERT INTO inventory (name, description, base_price) VALUES
		  ('Cactus', 'It is spikey and drought resistant', 12.99),
		  ('Pants', 'They are to keep the lower half of your body warm', 49.99)
		ON CONFLICT (name) DO NOTHING;`,
	},
	{
		name: "images",
		schema: `
		CREATE TABLE IF NOT EXISTS images (
		  id SERIAL PRIMARY KEY,
		  name VARCHAR(255) NOT NULL,
		  url VARCHAR(255) NOT NULL,
		  alt VARCHAR(255)
		);`,
		seed: `
		INSERT INTO images (name, url, alt) VALUES
		  ('name', 'https://placecats.com/300/200', 'this is a cat'),
		  ('name', 'https://placecats.com/neo/300/200', 'this is neo the cat');`,
	},
	{
		name: "company_users",
		schema: `
		CREATE TABLE company_users (
		  id SERIAL PRIMARY KEY,
		  user_id INT NOT NULL,
		  company_id INT NOT NULL,
		  CONSTRAINT fk_company_users_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
		  CONSTRAINT fk_company_users_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
		  CONSTRAINT unique_user_company UNIQUE (user_id, company_id)
		);`,
		seed: `INSERT INTO company_users (user_id, company_id)
			VALUES 
			  (1, 1),
			  (2, 1),
			  (1, 2),
			  (2, 2)
			ON CONFLICT (user_id, company_id) DO NOTHING;`,
	},
	{
		name: "company_inventory",
		schema: `
		CREATE TABLE company_inventory (
		  id SERIAL PRIMARY KEY,
		  company_id INT NOT NULL,
		  inventory_id INT NOT NULL,
		  quantity INT NOT NULL DEFAULT 0,
		  company_price DECIMAL(10, 2) NOT NULL,
		  CONSTRAINT fk_company_inventory_company FOREIGN KEY (company_id) REFERENCES company(id) ON DELETE CASCADE,
		  CONSTRAINT fk_company_inventory_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
		  CONSTRAINT unique_company_inventory UNIQUE (company_id, inventory_id)
		);`,
		seed: `
		INSERT INTO company_inventory (company_id, inventory_id, quantity, company_price)
		  VALUES 
		    (1, 1, 10, 5.99),
		    (1, 2, 15, 29.99),
		    (2, 1, 5,  6.00),
		    (2, 2, 20, 29.99)
		  ON CONFLICT (company_id, inventory_id) DO NOTHING;`,
	},
	{
		name: "inventory_images",
		schema: `
		CREATE TABLE inventory_images (
		  id SERIAL PRIMARY KEY,
		  inventory_id INT NOT NULL,
		  image_id INT NOT NULL,
		  CONSTRAINT fk_inventory_images_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id) ON DELETE CASCADE,
		  CONSTRAINT fk_inventory_images_image FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE,
		  CONSTRAINT unique_inventory_image UNIQUE (inventory_id, image_id)
	);`,
		seed: `INSERT INTO inventory_images (inventory_id, image_id)
		  VALUES 
		    (1, 1),
		    (1, 2),
		    (2, 1),
		    (2, 2)
		  ON CONFLICT (inventory_id, image_id) DO NOTHING;`,
	},
];

const migrate = async () => {
	await pool.query("BEGIN");

	try {
		console.log("🚀 Running database migration...");

		for (const table of [...tables].reverse()) {
			console.log(`🗑️ Dropping table if exists: ${table.name}`);
			await pool.query(`DROP TABLE IF EXISTS ${table.name} CASCADE;`);
		}

		for (const table of tables) {
			console.log(`🔹 Creating table: ${table.name}`);
			await pool.query(table.schema);

			if (table.seed) {
				console.log(`🌱 Seeding table: ${table.name}`);
				await pool.query(table.seed);
			}
		}

		await pool.query("COMMIT");
	} catch (err) {
		await pool.query("ROLLBACK");
		console.error("❌ Migration failed!", err);
		throw err;
	} finally {
		pool.end();
	}
};

migrate();
