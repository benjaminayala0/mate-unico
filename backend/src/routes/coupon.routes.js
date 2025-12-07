import { Router } from "express";
import { validarCupon } from "../controllers/coupon.controller.js";

const router = Router();

router.post("/validate", validarCupon);

export default router;