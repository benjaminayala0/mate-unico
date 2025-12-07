import { db } from "../db.js";

export const validarCupon = async (req, res) => {
  try {
    const { codigo, clienteId } = req.body;

    if (!codigo || !clienteId) {
        return res.status(400).json({ error: "Faltan datos." });
    }

    // 1. Buscar el cupón en la tabla 'cupons'
    const [rows] = await db.query(
      `SELECT * FROM cupons WHERE codigo = $1 AND activo = true`,
      { bind: [codigo] }
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cupón inválido o expirado" });
    }

    const cupon = rows[0];

    // 2. Verificar en 'cuponusados' si este cliente ya lo usó
    const [usado] = await db.query(
        `SELECT * FROM cuponusados WHERE cliente_id = $1 AND cupon_id = $2`,
        { bind: [clienteId, cupon.id] }
    );

    if (usado.length > 0) {
        return res.status(400).json({ error: "Ya utilizaste este cupón anteriormente" });
    }

    // 3. Si Todo OK: Devolvemos el porcentaje
    res.json({
      ok: true,
      id: cupon.id,
      codigo: cupon.codigo,
      porcentaje: Number(cupon.porcentaje), 
      mensaje: `¡Descuento del ${cupon.porcentaje}% aplicado!`
    });

  } catch (error) {
    console.error("Error validando cupón:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};