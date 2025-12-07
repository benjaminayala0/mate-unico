import { db } from "../db.js";

// Helper 1: obtener o crear carrito activo del usuario

async function getOrCreateCart(clienteId) {
  const [rows] = await db.query(
    `SELECT * FROM carrito
     WHERE cliente_id = $1 AND estado = 'activo'
     LIMIT 1`,
    { bind: [clienteId] }
  );

  if (rows.length > 0) return rows[0];

  const [nuevo] = await db.query(
    `INSERT INTO carrito (cliente_id, estado, precio_total)
     VALUES ($1, 'activo', 0)
     RETURNING *`,
    { bind: [clienteId] }
  );

  return nuevo[0];
}

// Helper 2: recalcular total del carrito

async function recalcularTotal(carritoId) {
  const [rows] = await db.query(
    `SELECT COALESCE(
        SUM((precio_unitario + costo_grabado) * cantidad), 0
      ) AS total
      FROM item_carrito
      WHERE carrito_id = $1`,
    { bind: [carritoId] }
  );

  const total = rows[0]?.total ?? 0;

  await db.query(
    `UPDATE carrito SET precio_total = $1 WHERE id = $2`,
    { bind: [total, carritoId] }
  );

  return total;
}

// GET /api/cart?clienteId=1

export const getCart = async (req, res) => {
  try {
    const clienteId = req.query.clienteId;

    if (!clienteId)
      return res.status(400).json({ error: "clienteId es obligatorio" });

    // Headers para matar el caché y evitar el error 304
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const carrito = await getOrCreateCart(clienteId);

    // Obtener items del carrito
    let [items] = await db.query(
      `SELECT 
          ic.id,
          ic.cantidad,
          ic.precio_unitario,
          ic.grabado_texto,
          ic.costo_grabado,
          ic.color,
          p.id AS producto_id,
          p.nombre,
          p.stock
        FROM item_carrito ic
        JOIN productos p ON p.id = ic.producto_id
        WHERE ic.carrito_id = $1
        ORDER BY ic.id ASC`, 
      { bind: [carrito.id] }
    );

    // Cargar imagen (con try/catch)
    for (const item of items) {
      try {
        // Usamos 127.0.0.1 para asegurar conexión local desde el backend
        const url = `http://127.0.0.1:1337/api/productos?filters[id][$eq]=${item.producto_id}&populate=*`;
        const response = await fetch(url);
        const data = await response.json();

        const imagenData = data?.data?.[0]?.imagen;

        if (Array.isArray(imagenData) && imagenData.length > 0) {
          // Devolvemos la URL para el frontend
          item.imagen = "http://localhost:1337" + imagenData[0].url;
        } else {
          item.imagen = null;
        }
      } catch (err) {
        console.error(`⚠️ Error cargando imagen para producto ${item.producto_id}:`, err.message);
        item.imagen = null; // Si falla, dejamos null para que el front ponga un placeholder
      }
    }

    res.json({
      carritoId: carrito.id,
      precio_total: carrito.precio_total,
      items,
    });
  } catch (err) {
    console.error("Error obteniendo carrito:", err);
    res.status(500).json({ error: "Error obteniendo carrito" });
  }
};

// POST /api/cart/add

export const addToCart = async (req, res) => {
  try {
    // DEBUG: Ver qué llega exactamente desde el Frontend
    console.log("📦 [addToCart] Body recibido:", req.body);

    const {
      clienteId,
      productoId,
      cantidad = 1,
      color = null,
      grabado_texto = null,
      costo_grabado = 0,
    } = req.body;

    if (!clienteId || !productoId)
      return res
        .status(400)
        .json({ error: "clienteId y productoId son obligatorios" });

    const [prodRows] = await db.query(
      `SELECT precio FROM productos WHERE id = $1`,
      { bind: [productoId] }
    );

    if (prodRows.length === 0)
      return res.status(404).json({ error: "Producto no encontrado" });

    const precioUnitario = prodRows[0].precio;

    const carrito = await getOrCreateCart(clienteId);

    // Verificar si existe un item IGUAL (mismo producto, mismo grabado, mismo color)
    const [existeRows] = await db.query(
      `SELECT * FROM item_carrito
       WHERE carrito_id = $1
         AND producto_id = $2
         AND COALESCE(grabado_texto,'') = COALESCE($3,'')
         AND COALESCE(color,'') = COALESCE($4,'')`,
      { bind: [carrito.id, productoId, grabado_texto, color] }
    );

    if (existeRows.length > 0) {
      console.log("🔄 Item ya existe en carrito. Actualizando cantidad...");
      const item = existeRows[0];
      await db.query(
        `UPDATE item_carrito
         SET cantidad = cantidad + $1
         WHERE id = $2`,
        { bind: [cantidad, item.id] }
      );
    } else {
      console.log("✨ Creando nuevo item en carrito...");
      await db.query(
        `INSERT INTO item_carrito 
         (cantidad, precio_unitario, grabado_texto, costo_grabado,
          a_comprar, carrito_id, producto_id, color)
         VALUES ($1,$2,$3,$4,true,$5,$6,$7)`,
        {
          bind: [
            cantidad,
            precioUnitario,
            grabado_texto,
            costo_grabado,
            carrito.id,
            productoId,
            color,
          ],
        }
      );
    }

    const nuevoTotal = await recalcularTotal(carrito.id);

    res.json({
      ok: true,
      carritoId: carrito.id,
      precio_total: nuevoTotal,
    });
  } catch (err) {
    console.error("🔥 Error agregando al carrito:", err);
    res.status(500).json({ error: "Error agregando al carrito" });
  }
};

// PUT /api/cart/update/:id

export const updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (!cantidad || cantidad < 1)
      return res.status(400).json({ error: "La cantidad debe ser >= 1" });

    const [rows] = await db.query(
      `SELECT * FROM item_carrito WHERE id = $1`,
      { bind: [id] }
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Item no encontrado" });

    const item = rows[0];

    await db.query(
      `UPDATE item_carrito SET cantidad = $1 WHERE id = $2`,
      { bind: [cantidad, id] }
    );

    const nuevoTotal = await recalcularTotal(item.carrito_id);

    res.json({
      ok: true,
      carritoId: item.carrito_id,
      precio_total: nuevoTotal,
    });
  } catch (err) {
    console.error("Error actualizando cantidad:", err);
    res.status(500).json({ error: "Error actualizando cantidad" });
  }
};

// DELETE /api/cart/remove/:id

export const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM item_carrito WHERE id = $1`,
      { bind: [id] }
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Item no encontrado" });

    const carritoId = rows[0].carrito_id;

    await db.query(`DELETE FROM item_carrito WHERE id = $1`, {
      bind: [id],
    });

    const nuevoTotal = await recalcularTotal(carritoId);

    res.json({
      ok: true,
      carritoId,
      precio_total: nuevoTotal,
    });
  } catch (err) {
    console.error("Error eliminando item:", err);
    res.status(500).json({ error: "Error eliminando item" });
  }
};

// DELETE /api/cart/clear

export const clearCart = async (req, res) => {
  try {
    const clienteId = req.query.clienteId;

    if (!clienteId)
      return res.status(400).json({ error: "clienteId es obligatorio" });

    const carrito = await getOrCreateCart(clienteId);

    await db.query(`DELETE FROM item_carrito WHERE carrito_id = $1`, {
      bind: [carrito.id],
    });

    await db.query(`UPDATE carrito SET precio_total = 0 WHERE id = $1`, {
      bind: [carrito.id],
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("Error vaciando carrito:", err);
    res.status(500).json({ error: "Error vaciando carrito" });
  }
};

// POST /api/cart/procesar

export const procesarCompra = (req, res) => {
  res.status(501).json({ error: "procesarCompra aún no implementado" });
};