import { db } from "../db.js";


// GET /api/domicilio?usuarioId=1

export const getDirecciones = async (req, res) => {
  try {
    const usuarioId = req.query.usuarioId;
    if (!usuarioId) {
      return res.status(400).json({ error: "usuarioId es obligatorio" });
    }

    const [rows] = await db.query(
      `SELECT id, calle, numero, telefono,
              ciudad, provincia, pais, codigo_postal
       FROM domicilio
       WHERE usuario_id = $1
       ORDER BY id`,
      { bind: [usuarioId] }
    );

    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo direcciones:", err);
    res.status(500).json({ error: "Error obteniendo direcciones" });
  }
};

  // POST /api/domicilio (crear dirección nueva) 

export const createDireccion = async (req, res) => {
  try {
    const {
      usuarioId,
      calle,
      numero,
      ciudad,
      provincia,
      pais,
      codigo_postal,
      telefono = null,
    } = req.body;

    if (
      !usuarioId ||
      !calle ||
      !numero ||
      !ciudad ||
      !provincia ||
      !pais ||
      !codigo_postal
    ) {
      return res.status(400).json({
        error:
          "usuarioId, calle, numero, ciudad, provincia, pais y codigo_postal son obligatorios",
      });
    }

    // 1) BUSCAR SI YA EXISTE MISMA DIRECCIÓN PARA ESTE USUARIO
    const [existe] = await db.query(
      `SELECT id, calle, numero, telefono, ciudad, provincia, pais, codigo_postal
       FROM domicilio
       WHERE usuario_id = $1
         AND calle = $2
         AND numero = $3
         AND ciudad = $4
         AND provincia = $5
         AND pais = $6
         AND codigo_postal = $7`,
      {
        bind: [
          usuarioId,
          calle,
          numero,
          ciudad,
          provincia,
          pais,
          codigo_postal,
        ],
      }
    );

    // Si ya existe, devolver esa y NO crear otra
    if (existe.length > 0) {
      return res.status(200).json({
        ...existe[0],
        duplicated: true,
        message: "Esta dirección ya existe, no se creó una nueva.",
      });
    }

    // 2) SI NO EXISTE, INSERTAR NUEVA DIRECCIÓN
    const [rows] = await db.query(
      `INSERT INTO domicilio 
         (calle, numero, telefono, ciudad, provincia, pais, codigo_postal, usuario_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, calle, numero, telefono,
                 ciudad, provincia, pais, codigo_postal`,
      {
        bind: [
          calle,
          numero,
          telefono,
          ciudad,
          provincia,
          pais,
          codigo_postal,
          usuarioId,
        ],
      }
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error creando dirección:", err);
    res.status(500).json({ error: "Error creando dirección" });
  }
};

// DELETE /api/domicilio/:id

export const deleteDireccion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.usuarioId;

    // 1) Verificar que exista
    const [rows] = await db.query(
      `SELECT * FROM domicilio WHERE id = $1 AND usuario_id = $2`,
      { bind: [id, userId] }
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Domicilio no encontrado" });
    }

    // 2) Verificar si está usada en alguna compra
    const [usado] = await db.query(
      `SELECT 1 FROM orden_compra WHERE domicilio_id = $1 LIMIT 1`,
      { bind: [id] }
    );

    if (usado.length > 0) {
      return res.status(400).json({
        error:
          "Esta dirección ya fue utilizada en una compra y no puede eliminarse.",
      });
    }

    // 3) Eliminar si no está usada
    await db.query(
      `DELETE FROM domicilio WHERE id = $1 AND usuario_id = $2`,
      { bind: [id, userId] }
    );

    return res.json({ ok: true, message: "Dirección eliminada con éxito" });
  } catch (err) {
    console.error("Error eliminando dirección:", err);
    res.status(500).json({ error: "Error eliminando dirección" });
  }
};
