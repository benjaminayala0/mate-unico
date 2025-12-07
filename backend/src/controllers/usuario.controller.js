import { db } from "../db.js";

export const actualizarUsuario = async (req, res) => {
  try {
    const id = req.params.id;
    const {
      nombre,
      apellido,
      genero,
      fecha_nacimiento,
      provincia,
      ciudad,
      domicilio,
      codigo_postal,
    } = req.body;

    const [updated] = await db.query(
      `
      UPDATE usuarios 
      SET 
        nombre = $1,
        apellido = $2,
        genero = $3,
        fecha_nacimiento = $4,
        provincia = $5,
        ciudad = $6,
        domicilio = $7,
        codigo_postal = $8
      WHERE id = $9
      RETURNING *
      `,
      {
        bind: [
          nombre,
          apellido,
          genero,
          fecha_nacimiento,
          provincia,
          ciudad,
          domicilio,
          codigo_postal,
          id,
        ],
      }
    );

    res.json({ ok: true, usuario: updated[0] });

  } catch (err) {
    console.error("Error actualizando usuario:", err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

//  FUNCIÓN PARA ELIMINAR FOTO
export const eliminarFoto = async (req, res) => {
  try {
    const id = req.params.id;

    await db.query(
      `
      UPDATE usuarios
      SET foto = NULL
      WHERE id = $1
      `,
      {
        bind: [id],
      }
    );

    res.json({ ok: true, message: "Foto eliminada", foto: null });

  } catch (err) {
    console.error("Error eliminando foto:", err);
    res.status(500).json({ error: "Error al eliminar foto" });
  }
};

//  FUNCIÓN PARA OBTENER HISTORIAL
export const obtenerHistorial = async (req, res) => {
  try {
    const userId = req.params.id;

    // Traemos todas las órdenes del usuario
    const [ordenes] = await db.query(
      `SELECT * FROM orden_compra WHERE cliente_id = $1 ORDER BY fecha_creacion DESC`,
      { bind: [userId] }
    );

    if (ordenes.length === 0)
      return res.json([]);

    let historial = [];

    for (let orden of ordenes) {
      // Traer líneas de compra de esa orden
      const [lineas] = await db.query(
        `SELECT * FROM linea_compra WHERE orden_id = $1`,
        { bind: [orden.id] }
      );

      for (let linea of lineas) {
        // Traer datos del producto
        const [producto] = await db.query(
          `SELECT id, nombre, precio, document_id FROM productos WHERE id = $1`,
          { bind: [linea.producto_id] }
        );

        let imgUrl = null;

        // Buscamos la imagen en Strapi
        if (producto.length > 0 && producto[0].document_id) {
          const [img] = await db.query(
            `SELECT url FROM imagen WHERE id = $1`,
            { bind: [producto[0].document_id] }
          );

          if (img.length > 0) imgUrl = img[0].url;
        }

        historial.push({
          producto: producto[0]?.nombre,
          imagen: imgUrl,
          fecha: orden.fecha_creacion,
          cantidad: linea.cantidad,
          precio: linea.precio_unitario,
          estado: orden.estado_pedido
        });
      }
    }

    return res.json(historial);

  } catch (error) {
    console.error("Error obteniendo historial:", error);
    res.status(500).json({ error: "Error obteniendo historial" });
  }
};