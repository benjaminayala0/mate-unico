import { db } from "../db.js";

export const testDB = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM producto LIMIT 5;");
    res.json({
      status: "ok",
      cantidad: rows.length,
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
};
