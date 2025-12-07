import { Router } from "express";

import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  procesarCompra
} from "../controllers/cart.controller.js";

const router = Router();

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/update/:id", updateQuantity);
router.delete("/remove/:id", removeFromCart);
router.delete("/clear", clearCart);
router.post("/procesar", procesarCompra);

export default router;
