import { Router } from "express";
import multer from "multer";
import path from "path";
import { actualizarUsuario, eliminarFoto } from "../controllers/usuario.controller.js";
import Usuario from "../models/usuario.model.js";
import { getHistorialUsuario } from "../controllers/order.controller.js";

const router = Router();

// CONFIGURACIÓN MULTER
const storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `user_${req.params.id}${ext}`);
  },
});

const upload = multer({ storage });

// ACTUALIZAR CAMPOS NORMALES 
router.put("/:id", actualizarUsuario);

// ACTUALIZAR FOTO
router.patch("/:id/foto", upload.single("foto"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No se recibió ninguna imagen" });

    const filePath = `/uploads/${req.file.filename}`;

    await Usuario.update(
      { foto: filePath },
      { where: { id: req.params.id } }
    );

    return res.json({ foto: filePath });
  } catch (error) {
    console.error("Error al subir foto:", error);
    res.status(500).json({ error: "Error al actualizar foto" });
  }
});

// ELIMINAR FOTO
router.delete("/:id/foto", eliminarFoto);


// Alternativamente, si se desea usar el controlador del order.controller.js
router.get("/:id/historial", getHistorialUsuario);

export default router;
