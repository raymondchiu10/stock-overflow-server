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
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
		name: "inventory",
		schema: `
    CREATE TABLE IF NOT EXISTS inventory (
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255),
      url VARCHAR(255) NOT NULL,
      alt VARCHAR(255),
      cloudinary JSONB
    );`,
		seed: `
    INSERT INTO images (uuid, name, url, alt) VALUES
      ('550e8400-e29b-41d4-a716-446655440006', 'name', 'https://res.cloudinary.com/raymond-chiu/image/upload/v1723857547/profile_raymond-chiu.webp', 'this is a person'),
      ('550e8400-e29b-41d4-a716-446655440007', 'name', 'https://res.cloudinary.com/raymond-chiu/image/upload/v1743920954/il_1588xN.3251603922_7lpp_fbg1od.jpg', 'this is pants')
    ON CONFLICT (uuid) DO NOTHING;`,
	},
	{
		name: "inventory_images",
		schema: `
    CREATE TABLE inventory_images (
      uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      inventory_uuid UUID NOT NULL,
      image_uuid UUID NOT NULL,
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
