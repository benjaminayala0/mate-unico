import { Router } from "express";
import { calculateShipping } from "../controllers/shipping.controller.js";

const router = Router();

router.get("/", calculateShipping);

export default router;
