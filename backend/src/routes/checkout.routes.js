import { Router } from "express";
import { crearCheckout, webhookMercadoPago } from "../controllers/checkout.controller.js";

const router = Router();

// POST /api/checkout/create
router.post("/create", crearCheckout);

// POST /api/checkout/webhook
router.post("/webhook", webhookMercadoPago);

export default router;
