import { db } from "../db.js";

// verificar si el usuario compró ese producto

async function userHasPurchasedProduct(clienteId, productoId) {
  const [rows] = await db.query(
    `
    SELECT 1
    FROM orden_compra oc
    JOIN item_carrito ic ON ic.carrito_id = oc.carrito_id
    WHERE oc.cliente_id = $1
      AND ic.producto_id = $2
    LIMIT 1
    `,
    { bind: [clienteId, productoId] }
  );

  return rows.length > 0;
}

// verificar si el usuario ya reseñó ese producto

async function userAlreadyReviewed(clienteId, productoId) {
  const [rows] = await db.query(
    `
    SELECT 1
    FROM resena
    WHERE cliente_id = $1
      AND producto_id = $2
    LIMIT 1
    `,
    { bind: [clienteId, productoId] }
  );

  return rows.length > 0;
}


  // POST /api/reviews
  // Crear reseña

export const addReview = async (req, res) => {
  try {
    const { productId, rating, comentario, clienteId } = req.body;

    if (!productId || !rating || !clienteId) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const calificacion = parseInt(rating, 10);
    if (isNaN(calificacion) || calificacion < 1 || calificacion > 5) {
      return res.status(400).json({
        message: "La calificación debe ser un número entre 1 y 5",
      });
    }

    // 1) validar compra previa
    const hasPurchased = await userHasPurchasedProduct(clienteId, productId);
    if (!hasPurchased) {
      return res.status(403).json({
        message: "Solo podés reseñar productos que hayas comprado",
      });
    }

    // 2) validar que no exista reseña previa
    const already = await userAlreadyReviewed(clienteId, productId);
    if (already) {
      return res
        .status(400)
        .json({ message: "Ya escribiste una reseña para este producto" });
    }

    // 3) insertar reseña
    const [inserted] = await db.query(
      `
      INSERT INTO resena (calificacion, comentario, permitido, fecha, cliente_id, producto_id)
      VALUES ($1, $2, true, CURRENT_DATE, $3, $4)
      RETURNING *
      `,
      { bind: [calificacion, comentario || "", clienteId, productId] }
    );

    return res.status(201).json(inserted[0]);
  } catch (err) {
    console.error("Error creando reseña:", err);
    res.status(500).json({ message: "Error creando reseña" });
  }
};

  //GET /api/reviews/product/:productId
  //Obtener reseñas y promedio

export const getReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        r.id,
        r.calificacion,
        r.comentario,
        r.fecha,
        r.cliente_id,
        u.nombre,
        u.apellido,

        u.foto

      FROM resena r
      JOIN usuarios u ON u.id = r.cliente_id
      WHERE r.producto_id = $1
        AND r.permitido = true
      ORDER BY r.fecha DESC, r.id DESC
      `,
      { bind: [productId] }
    );

    const [statsRows] = await db.query(
      `
      SELECT 
        COALESCE(AVG(calificacion), 0) AS promedio,
        COUNT(*) AS total
      FROM resena
      WHERE producto_id = $1
        AND permitido = true
      `,
      { bind: [productId] }
    );

    const stats = statsRows[0] || { promedio: 0, total: 0 };

    return res.json({
      reviews: rows,
      averageRating: Number(stats.promedio),
      total: Number(stats.total),
    });
  } catch (err) {
    console.error("Error obteniendo reseñas:", err);
    res.status(500).json({ message: "Error obteniendo reseñas" });
  }
};


  //GET /api/reviews/can/:productId/:clienteId
  //Saber si un usuario puede reseñar

export const canUserReview = async (req, res) => {
  try {
    const { productId, clienteId } = req.params;

    const hasPurchased = await userHasPurchasedProduct(clienteId, productId);
    const already = await userAlreadyReviewed(clienteId, productId);

    return res.json({
      canReview: hasPurchased && !already,
      hasPurchased,
      alreadyReviewed: already,
    });
  } catch (err) {
    console.error("Error verificando permiso de reseña:", err);
    res.status(500).json({ message: "Error verificando permiso de reseña" });
  }
};
