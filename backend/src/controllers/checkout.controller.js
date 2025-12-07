import { db } from "../db.js";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { enviarCorreoCompra } from "../helpers/mailer.js"; 
import crypto from "node:crypto";

// MERCADO PAGO

const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});
const paymentClient = new Payment(mpClient);

// Helpers

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

async function getCartItems(carritoId) {
  const [items] = await db.query(
    `SELECT 
        ic.id,
        ic.cantidad,
        ic.precio_unitario,
        ic.costo_grabado,
        ic.grabado_texto,
        p.id AS producto_id,
        p.nombre,
        p.stock
      FROM item_carrito ic
      JOIN productos p ON p.id = ic.producto_id
      WHERE ic.carrito_id = $1`,
    { bind: [carritoId] }
  );

  return items;
}

// POST /api/checkout/create

export const crearCheckout = async (req, res) => {
  try {
    const { clienteId, domicilioId, nuevaDireccion, cuponId } = req.body;

    if (!clienteId)
      return res.status(400).json({ error: "clienteId es obligatorio" });

    if (!domicilioId && !nuevaDireccion)
      return res
        .status(400)
        .json({ error: "Debe enviar domicilioId ó nuevaDireccion" });

    // 1) Obtener carrito e items originales
    const carrito = await getOrCreateCart(clienteId);
    const itemsOriginales = await getCartItems(carrito.id);

    if (!itemsOriginales.length) {
      return res.status(400).json({ error: "El carrito está vacío" });
    }
    
  // 2) FILTRAR SOLO PRODUCTOS CON STOCK 

    const itemsValidos = itemsOriginales.filter(item => item.stock >= item.cantidad);

    // Si después de filtrar no queda nada, bloqueamos la compra
    if (itemsValidos.length === 0) {
        return res.status(400).json({ error: "No hay productos con stock suficiente para continuar." });
    }

    // 3) RECALCULAR SUBTOTAL CON ITEMS VÁLIDOS
    let subtotal = 0;
    for (const item of itemsValidos) {
        const precioItem = Number(item.precio_unitario) + Number(item.costo_grabado);
        subtotal += precioItem * Number(item.cantidad);
    }

    let montoTotal = subtotal;
    let porcentajeDescuento = 0; 

    // A. Cupón
    if (cuponId) {
        const [cupons] = await db.query(`SELECT * FROM cupons WHERE id = $1 AND activo = true`, {bind: [cuponId]});
        if(cupons.length > 0) {
            const [usado] = await db.query(`SELECT * FROM cuponusados WHERE cliente_id = $1 AND cupon_id = $2`, {bind: [clienteId, cuponId]});
            if (usado.length === 0) {
                porcentajeDescuento = Number(cupons[0].porcentaje);
                const descuentoAplicado = (subtotal * porcentajeDescuento) / 100;
                montoTotal = montoTotal - descuentoAplicado;
            }
        }
    }

    // B. Envío 
    const ENVIO_GRATIS_LIMITE = 150000;
    const COSTO_ENVIO = 10000;
    let costoEnvioFinal = 0;

    if (subtotal < ENVIO_GRATIS_LIMITE) {
        costoEnvioFinal = COSTO_ENVIO;
        montoTotal += costoEnvioFinal; 
    }

    if (montoTotal < 0) montoTotal = 0;


    // 3) DOMICILIO
 
    let domicilioRow = null;

    // CASO 1: DIRECCIÓN EXISTENTE
    if (domicilioId) {
      const [rows] = await db.query(
        `SELECT * FROM domicilio WHERE id = $1 AND usuario_id = $2`,
        { bind: [domicilioId, clienteId] }
      );

      if (rows.length === 0)
        return res.status(404).json({ error: "Domicilio no encontrado" });

      domicilioRow = rows[0];
    }

    // CASO 2: NUEVA DIRECCIÓN
    if (nuevaDireccion) {
      const { calle, numero, ciudad, provincia, pais, codigo_postal, telefono = null } = nuevaDireccion;

      const [existe] = await db.query(
        `SELECT * FROM domicilio WHERE usuario_id = $1 AND calle = $2 AND numero = $3 AND codigo_postal = $4 LIMIT 1`,
        { bind: [clienteId, calle, numero, codigo_postal] }
      );

      if (existe.length > 0) {
        domicilioRow = existe[0];
      } else {
        const [rows] = await db.query(
          `INSERT INTO domicilio (calle, numero, ciudad, provincia, pais, codigo_postal, telefono, usuario_id)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          { bind: [calle, numero, ciudad, provincia, pais, codigo_postal, telefono, clienteId] }
        );
        domicilioRow = rows[0];
      }
    }

    // 4) CREAR ORDEN 
    const direccionEnvio = `${domicilioRow.calle} ${domicilioRow.numero}`;

    const [ordenRows] = await db.query(
      `INSERT INTO orden_compra (
          monto_total, estado_pago, transportista, estado_pedido, fecha_creacion,
          cliente_id, pago_id,
          direccion_envio, ciudad_envio, provincia_envio,
          pais_envio, codigo_postal_envio, domicilio_id, carrito_id
        )
        VALUES (
          $1, 'pendiente', NULL, 'pendiente', CURRENT_DATE,
          $2, NULL,
          $3, $4, $5,
          $6, $7, $8, $9
        )
        RETURNING *`,
      {
        bind: [
          montoTotal, 
          clienteId,
          direccionEnvio,
          domicilioRow.ciudad,
          domicilioRow.provincia,
          domicilioRow.pais,
          domicilioRow.codigo_postal,
          domicilioRow.id,
          carrito.id,
        ],
      }
    );

    const orden = ordenRows[0];

    // GUARDAR ITEMS 
    for (const item of itemsValidos) {
      await db.query(
        `INSERT INTO linea_compra 
           (orden_id, producto_id, cantidad, precio_unitario, grabado_texto, costo_grabado)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        {
          bind: [
            orden.id,
            item.producto_id,
            item.cantidad,
            item.precio_unitario,
            item.grabado_texto,
            item.costo_grabado,
          ],
        }
      );
    }

  // 5) MERCADO PAGO
   
    // Solo manda MP los items que sí tienen stock
    const itemsMP = itemsValidos.map((it) => {
        let unitPrice = Number(it.precio_unitario) + Number(it.costo_grabado);
        
        // Aplicar descuento porcentual directamente
        if (porcentajeDescuento > 0) {
            unitPrice = unitPrice * (1 - (porcentajeDescuento / 100));
        }

        return {
            title: it.nombre,
            quantity: Number(it.cantidad),
            unit_price: unitPrice,
            currency_id: "ARS",
        };
    });

    // Agregar Envío como ítem si corresponde
    if (costoEnvioFinal > 0) {
        itemsMP.push({
            title: "Costo de Envío",
            quantity: 1,
            unit_price: costoEnvioFinal,
            currency_id: "ARS"
        });
    }

    const preference = new Preference(mpClient);

    const mpRes = await preference.create({
      body: {
        items: itemsMP,
        
        metadata: { 
            cliente_id: clienteId,
            cupon_id: cuponId || null 
        },
        
        back_urls: {
          success: `${process.env.FRONTEND_URL}/checkout/success`,
          failure: `${process.env.FRONTEND_URL}/checkout/failure`,
          pending: `${process.env.FRONTEND_URL}/checkout/pending`,
        },
        auto_return: "approved",
        external_reference: String(orden.id),
        notification_url: `${process.env.BACKEND_URL}/api/checkout/webhook`,
      },
    });

    return res.json({
      ok: true,
      orderId: orden.id,
      init_point: mpRes.init_point,
    });
  } catch (err) {
    console.error("Error creando checkout:", err);
    res.status(500).json({ error: "Error creando checkout" });
  }
};

// WEBHOOK 

export const webhookMercadoPago = async (req, res) => {
  try {
    const topic = req.query.topic || req.query.type;
    const paymentId =
      req.query.id || req.query["data.id"] || req.body?.data?.id;

    if (topic !== "payment" || !paymentId) return res.sendStatus(200);

    const pago = await paymentClient.get({ id: paymentId });

    const statusMp = pago.status;
    const externalRef = Number(pago.external_reference);

    const statusMap = {
      approved: "aprobado",
      rejected: "rechazado",
      pending: "pendiente",
    };

    const estadoPagoBd = statusMap[statusMp] || "pendiente";

    // 1) Ver si la orden YA está procesada
    const [ordenActual] = await db.query(
      `SELECT estado_pago, carrito_id, cliente_id, monto_total
        FROM orden_compra 
        WHERE id = $1`,
      { bind: [externalRef] }
    );

    if (!ordenActual.length) return res.sendStatus(200);

    const orden = ordenActual[0];

    if (orden.estado_pago === "aprobado") {
      return res.sendStatus(200);
    }

    // 2) Actualizar estado 
    const [updateResult] = await db.query(
      `UPDATE orden_compra
        SET estado_pago = $1, pago_id = $2
        WHERE id = $3 AND estado_pago != 'aprobado'
        RETURNING id`,
      { bind: [estadoPagoBd, paymentId, externalRef] }
    );

    if (!updateResult || updateResult.length === 0) {
        return res.sendStatus(200);
    }

    // 3) Solo si se APRUEBA: se ejecuta lógica de negocio
    if (estadoPagoBd === "aprobado") {
      const carritoId = orden.carrito_id;
      const clienteId = orden.cliente_id;

      const items = await getCartItems(carritoId);

      // 4) Descontar stock (Solo descontamos lo que se vendió realmente)
      const itemsValidos = items.filter(item => item.stock >= item.cantidad);

      for (const item of itemsValidos) {
        await db.query(
          `UPDATE productos
            SET stock = stock - $1
            WHERE id = $2`,
          { bind: [item.cantidad, item.producto_id] }
        );
      }

      // 5) REGISTRAR USO DE CUPÓN 
      const metadata = pago.metadata; 
      if (metadata && metadata.cupon_id) {
          try {
              // Generamos un UUID para Strapi
              const documentId = crypto.randomUUID(); 
              await db.query(
                  `INSERT INTO cuponusados (cliente_id, cupon_id, pedido_id, document_id) 
                   VALUES ($1, $2, $3, $4)`,
                  { bind: [metadata.cliente_id, metadata.cupon_id, externalRef, documentId] }
              );
              console.log("🎟️ Cupón registrado como usado.");
          } catch (err) { console.error("Error guardando cupón:", err); }
      }

      // 6) Cerrar carrito y crear nuevo
      await db.query(
        `UPDATE carrito SET estado = 'cerrado'
          WHERE id = $1`,
        { bind: [carritoId] }
      );

      await db.query(
        `INSERT INTO carrito (cliente_id, estado, precio_total)
          VALUES ($1, 'activo', 0)`,
        { bind: [clienteId] }
      );

      // 7) ENVIAR EMAIL DE CONFIRMACIÓN EN SEGUNDO PLANO
      (async () => {
        try {
          const [userRows] = await db.query(
            `SELECT email FROM usuarios WHERE id = $1`,
            { bind: [clienteId] }
          );

          if (userRows.length > 0) {
            const emailUser = userRows[0].email;
            console.log(`📧 Preparando envío de email a: ${emailUser} (Background)`);
            
            // items con FOTOS
            for (const item of itemsValidos) {
               try {
                  const url = `http://127.0.0.1:1337/api/productos?filters[id][$eq]=${item.producto_id}&populate=*`;
                  const response = await fetch(url);
                  const data = await response.json();
                  const imagenData = data?.data?.[0]?.imagen;
                  if (Array.isArray(imagenData) && imagenData.length > 0) {
                      item.imagen = "http://localhost:1337" + imagenData[0].url; 
                  }
               } catch(e) { console.log("Error foto email", e.message); }
            }

            // Enviar el correo (Solo con los items válidos)
            await enviarCorreoCompra(emailUser, externalRef, itemsValidos, orden.monto_total);
          }
        } catch (mailErr) {
          console.error("⚠️ Error proceso email background:", mailErr);
        }
      })();
    }

    return res.sendStatus(200);

  } catch (err) {
    console.error("Error en webhook de MercadoPago:", err);
    return res.sendStatus(500);
  }
};