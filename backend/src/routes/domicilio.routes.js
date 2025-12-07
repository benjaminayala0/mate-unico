import { Router } from "express";
import {
  getDirecciones,
  createDireccion,
  deleteDireccion
} from "../controllers/domicilio.controller.js";

const router = Router();

router.get("/", getDirecciones);
router.post("/", createDireccion);
router.delete("/:id", deleteDireccion);

export default router;
