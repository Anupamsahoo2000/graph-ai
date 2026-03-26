const { Sequelize } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, "..", ".env");
dotenv.config({ path: envPath });

// Render's internal network strictly rejects SSL.
// But connecting from your local machine (externally) requires it!
const isRenderExternal = process.env.DB_HOST && process.env.DB_HOST.includes(".render.com");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions: isRenderExternal
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
  }
);

(async () => {
  try {
    if (typeof process.env.DB_PASSWORD !== "string") {
      throw new Error(
        `DB_PASSWORD must be a string (got ${typeof process.env.DB_PASSWORD}). Check ${envPath}`
      );
    }
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected via Sequelize");
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
    process.exit(1);
  }
})();

module.exports = { sequelize };
