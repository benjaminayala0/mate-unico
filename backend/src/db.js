import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

export const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: false,
  }
);

export const connectDB = async () => {
  try {
    await db.authenticate();
    console.log(" Conectado a PostgreSQL correctamente");
  } catch (err) {
    console.error(" Error al conectar DB:", err);
  }
};
