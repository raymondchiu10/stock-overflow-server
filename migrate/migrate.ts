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
      uuid VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`,
		seed: `
    INSERT INTO users (uuid, email, password, role) VALUES
      ('550e8400-e29b-41d4-a716-446655440000', 'admin@test.test', '$2b$10$0hkUO0Whbejoetr/gYsV0urTCxTdQG9fEe0r.tN8cwE1sKHRW1MIy', 'admin'),
      ('550e8400-e29b-41d4-a716-446655440001', 'client@test.test', '$2b$10$0hkUO0Whbejoetr/gYsV0urTCxTdQG9fEe0r.tN8cwE1sKHRW1MIy', 'client')
    ON CONFLICT (uuid) DO NOTHING;`,
	},
	{
		name: "company",
		schema: `
    CREATE TABLE IF NOT EXISTS company (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(100) UNIQUE NOT NULL,
      isActive BOOLEAN DEFAULT TRUE
    );`,
		seed: `
    INSERT INTO company (uuid, name, isActive) VALUES
      ('550e8400-e29b-41d4-a716-446655440002', 'Landscaping Company', true),
      ('550e8400-e29b-41d4-a716-446655440003', 'Pants Company', false)
    ON CONFLICT (uuid) DO NOTHING;`,
	},
	{
		name: "inventory",
		schema: `
    CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(100) UNIQUE NOT NULL,
      description VARCHAR(255),
      base_price DECIMAL(10, 2) NOT NULL
    );`,
		seed: `
    INSERT INTO inventory (uuid, name, description, base_price) VALUES
      ('550e8400-e29b-41d4-a716-446655440004', 'Cactus', 'It is spikey and drought resistant', 12.99),
      ('550e8400-e29b-41d4-a716-446655440005', 'Pants', 'They are to keep the lower half of your body warm', 49.99)
    ON CONFLICT (uuid) DO NOTHING;`,
	},
	{
		name: "images",
		schema: `
    CREATE TABLE IF NOT EXISTS images (
      id SERIAL PRIMARY KEY,
      uuid VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(255) NOT NULL,
      alt VARCHAR(255)
    );`,
		seed: `
    INSERT INTO images (uuid, name, url, alt) VALUES
      ('550e8400-e29b-41d4-a716-446655440006', 'name', 'https://placecats.com/300/200', 'this is a cat'),
      ('550e8400-e29b-41d4-a716-446655440007', 'name', 'https://placecats.com/neo/300/200', 'this is neo the cat')
    ON CONFLICT (uuid) DO NOTHING;`,
	},
	{
		name: "company_users",
		schema: `
    CREATE TABLE company_users (
      id SERIAL PRIMARY KEY,
      user_uuid VARCHAR(255) NOT NULL,
      company_uuid VARCHAR(255) NOT NULL,
      CONSTRAINT fk_company_users_user FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE CASCADE,
      CONSTRAINT fk_company_users_company FOREIGN KEY (company_uuid) REFERENCES company(uuid) ON DELETE CASCADE,
      CONSTRAINT unique_user_company UNIQUE (user_uuid, company_uuid)
    );`,
		seed: `
    INSERT INTO company_users (user_uuid, company_uuid)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002'),
        ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'),
        ('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440003'),
        ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003')
      ON CONFLICT (user_uuid, company_uuid) DO NOTHING;`,
	},
	{
		name: "company_inventory",
		schema: `
    CREATE TABLE company_inventory (
      id SERIAL PRIMARY KEY,
      company_uuid VARCHAR(255) NOT NULL,
      inventory_uuid VARCHAR(255) NOT NULL,
      quantity INT NOT NULL DEFAULT 0,
      company_price DECIMAL(10, 2) NOT NULL,
      CONSTRAINT fk_company_inventory_company FOREIGN KEY (company_uuid) REFERENCES company(uuid) ON DELETE CASCADE,
      CONSTRAINT fk_company_inventory_inventory FOREIGN KEY (inventory_uuid) REFERENCES inventory(uuid) ON DELETE CASCADE,
      CONSTRAINT unique_company_inventory UNIQUE (company_uuid, inventory_uuid)
    );`,
		seed: `
    INSERT INTO company_inventory (company_uuid, inventory_uuid, quantity, company_price)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', 10, 5.99),
        ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', 15, 29.99),
        ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 5,  6.00),
        ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 20, 29.99)
      ON CONFLICT (company_uuid, inventory_uuid) DO NOTHING;`,
	},
	{
		name: "inventory_images",
		schema: `
    CREATE TABLE inventory_images (
      id SERIAL PRIMARY KEY,
      inventory_uuid VARCHAR(255) NOT NULL,
      image_uuid VARCHAR(255) NOT NULL,
      CONSTRAINT fk_inventory_images_inventory FOREIGN KEY (inventory_uuid) REFERENCES inventory(uuid) ON DELETE CASCADE,
      CONSTRAINT fk_inventory_images_image FOREIGN KEY (image_uuid) REFERENCES images(uuid) ON DELETE CASCADE,
      CONSTRAINT unique_inventory_image UNIQUE (inventory_uuid, image_uuid)
    );`,
		seed: `
    INSERT INTO inventory_images (inventory_uuid, image_uuid)
      VALUES 
        ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440006'),
        ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440007'),
        ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006'),
        ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007')
      ON CONFLICT (inventory_uuid, image_uuid) DO NOTHING;`,
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
		console.log("✅ Migration completed successfully!");
	} catch (err) {
		await pool.query("ROLLBACK");
		console.error("❌ Migration failed!", err);
		throw err;
	} finally {
		pool.end();
	}
};

migrate();
