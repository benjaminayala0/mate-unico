import { db } from "../db.js";

// 1) Obtener UNA orden específica 
// GET /api/orders/:id
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    // A) Datos de la cabecera + SEGUIMIENTO
    const [orden] = await db.query(
      `SELECT 
          oc.*,
          s.estado AS estado_envio,
          s.codigo_seguimiento
       FROM orden_compra oc
       LEFT JOIN seguimientos s ON s.order_id = oc.id
       WHERE oc.id = $1`,
      { bind: [id] }
    );

    if (!orden.length) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    // B) Items comprados
    const [items] = await db.query(
      `SELECT 
         lc.cantidad,
         lc.precio_unitario,
         lc.grabado_texto,
         p.id as producto_id,
         p.nombre
       FROM linea_compra lc
       JOIN productos p ON p.id = lc.producto_id
       WHERE lc.orden_id = $1`,
      { bind: [id] }
    );

    // C) Cargar imágenes desde Strapi 
    await Promise.all(items.map(async (item) => {
      try {
        // Usamos localhost directo porque esto corre en el servidor
        const url = `http://127.0.0.1:1337/api/productos?filters[id][$eq]=${item.producto_id}&populate=*`;
        const response = await fetch(url);
        const data = await response.json();
        const imagenData = data?.data?.[0]?.imagen;

        if (Array.isArray(imagenData) && imagenData.length > 0) {
          item.imagen = "http://localhost:1337" + imagenData[0].url;
        } else {
          item.imagen = null;
        }
      } catch (err) {
        console.error(`Error imagen item ${item.producto_id}:`, err.message);
        item.imagen = null;
      }
    }));

    res.json({
      orden: orden[0],
      items
    });

  } catch (error) {
    console.error("Error obteniendo orden:", error);
    res.status(500).json({ error: "Error al obtener la orden" });
  }
};


// 2) Historial de compras 
// GET /api/usuarios/:id/historial
export const getHistorialUsuario = async (req, res) => {
  try {
    const usuarioId = req.params.id;

    // Filtrar solo 'aprobado' en SQL
    // Esto evita traer basura de intentos fallidos
    const [ordenes] = await db.query(
      `SELECT 
          oc.id, 
          oc.monto_total, 
          oc.estado_pago, 
          oc.fecha_creacion,
          oc.direccion_envio,
          oc.ciudad_envio,
          oc.provincia_envio,
          oc.codigo_postal_envio,
          s.estado AS estado_envio,
          s.codigo_seguimiento,
          c.codigo AS cupon_codigo,       
          c.porcentaje AS cupon_porcentaje
       FROM orden_compra oc
       LEFT JOIN seguimientos s ON s.order_id = oc.id
       LEFT JOIN cuponusados cu ON cu.pedido_id = oc.id  
       LEFT JOIN cupons c ON c.id = cu.cupon_id
       WHERE oc.cliente_id = $1 
         AND oc.estado_pago = 'aprobado'  
       ORDER BY oc.id DESC`,
      { bind: [usuarioId] }
    );

    if (ordenes.length === 0) {
      return res.json({ ordenes: [] });
    }

    const resultados = [];

    // 2) Recorrer órdenes 
    for (const orden of ordenes) {
      const [items] = await db.query(
        `SELECT 
            p.nombre,
            p.id AS producto_id,
            lc.cantidad,
            lc.precio_unitario AS precio,
            lc.grabado_texto
          FROM linea_compra lc
          JOIN productos p ON p.id = lc.producto_id
          WHERE lc.orden_id = $1`,
        { bind: [orden.id] }
      );

      // Cargar imágenes en PARALELO
      // En lugar de esperar una por una, las pedimos todas juntas a Strapi
      await Promise.all(items.map(async (item) => {
        try {
            const url = `http://127.0.0.1:1337/api/productos?filters[id][$eq]=${item.producto_id}&populate=*`;
            const response = await fetch(url);
            const data = await response.json();
            const imagenData = data?.data?.[0]?.imagen;
    
            if (Array.isArray(imagenData) && imagenData.length > 0) {
              item.imagen = "http://localhost:1337" + imagenData[0].url;
            } else {
              item.imagen = null;
            }
        } catch(e) { 
            item.imagen = null; 
        }
      }));

      resultados.push({
        id: orden.id,
        monto_total: orden.monto_total,
        direccion_envio: orden.direccion_envio,
        ciudad_envio: orden.ciudad_envio,
        provincia_envio: orden.provincia_envio,
        codigo_postal_envio: orden.codigo_postal_envio,
        cupon_codigo: orden.cupon_codigo || null,
        cupon_porcentaje: orden.cupon_porcentaje || null,
        fecha: orden.fecha_creacion,
        estado: orden.estado_pago,
        estado_envio: orden.estado_envio || null,
        codigo_seguimiento: orden.codigo_seguimiento || null,
        productos: items
      });
    }

    return res.json({ ordenes: resultados });

  } catch (err) {
    console.error("Error obteniendo historial:", err);
    res.status(500).json({ error: "Error cargando historial" });
  }
};