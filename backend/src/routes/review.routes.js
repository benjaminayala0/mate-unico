import { Router } from "express";
import { addReview, getReviews, canUserReview } from "../controllers/review.controller.js";

const router = Router();

// Crear reseña
router.post("/", addReview);

// Listar reseñas de un producto + promedio
router.get("/product/:productId", getReviews);

// Saber si un usuario puede reseñar ese producto
router.get("/can/:productId/:clienteId", canUserReview);

export default router;
