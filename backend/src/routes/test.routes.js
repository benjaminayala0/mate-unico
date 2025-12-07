import { Router } from "express";
import { testDB } from "../controllers/test.controller.js";

const router = Router();

router.get("/", testDB);

export default router;
