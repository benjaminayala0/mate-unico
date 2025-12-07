import { Router } from "express";
import { getOrderById } from "../controllers/order.controller.js";

const router = Router();

// Ruta para obtener UNA orden por ID (usada en PaymentSuccess)
router.get("/:id", getOrderById);

export default router;