import axios from "axios";
import jwt from "jsonwebtoken";
import { db } from "../db.js"; 

export const loginWithGoogle = async (req, res) => {
  try {
    const { tokenGoogle } = req.body;

    // 1) VALIDAR EL TOKEN
    if (!tokenGoogle) {
      return res.status(400).json({ error: "Falta tokenGoogle" });
    }

    console.log("🔍 Recibiendo tokenGoogle:", tokenGoogle.substring(0, 15) + "...");

    // 2) VALIDAR TOKEN CON GOOGLE
    let googleRes;
    try {
      googleRes = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${tokenGoogle}`
      );
    } catch (err) {
      console.error("❌ Error validando token con Google:", err.response?.data || err);
      return res.status(401).json({
        error: "Token de Google inválido",
        detail: err.response?.data || err.message,
      });
    }

    // 3) EXTRAER DATOS REALES DE GOOGLE
    const { email, given_name, family_name, picture, sub } = googleRes.data;

    if (!email || !sub) {
      console.error("❌ Google devolvió datos incompletos:", googleRes.data);
      return res.status(500).json({
        error: "Google no devolvió la información necesaria del usuario",
      });
    }

    console.log("✅ Google verificó correctamente a:", email);

    // 4) BUSCAR USUARIO YA EXISTENTE
    const [user] = await db.query(
      "SELECT * FROM usuarios WHERE google_id = $1 OR email = $2 LIMIT 1",
      {
        bind: [sub, email],
        type: db.QueryTypes.SELECT,
      }
    );

    let userFinal = user;

    // 5) SI NO EXISTE, LO CREAMOS
    if (!user) {
      console.log("🆕 Usuario nuevo, creando en DB...");

      const [nuevo] = await db.query(
        `INSERT INTO usuarios (google_id, email, nombre, apellido)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        {
          bind: [sub, email, given_name, family_name],
          type: db.QueryTypes.INSERT,
        }
      );

      userFinal = nuevo[0];
    } else {
      console.log("🔁 Usuario ya existente, login normal:", user.email);
    }

    // 6) CREAR / OBTENER CARRITO
    console.log("🛒 Verificando carrito del usuario...");

    const [carritoExistente] = await db.query(
      `SELECT * FROM carrito WHERE cliente_id = $1 AND estado = 'activo' LIMIT 1`,
      { bind: [userFinal.id] }
    );

    let carrito;

    if (carritoExistente.length > 0) {
      carrito = carritoExistente[0];
      console.log("🛒 Carrito existente encontrado:", carrito.id);
    } else {
      console.log("🛒 No había carrito → creando uno nuevo...");

      const [nuevoCarrito] = await db.query(
        `
        INSERT INTO carrito (precio_total, estado, cliente_id)
        VALUES (0, 'activo', $1)
        RETURNING *
        `,
        { bind: [userFinal.id] }
      );

      carrito = nuevoCarrito[0];
      console.log("🛒 Carrito nuevo creado:", carrito.id);
    }

    // 7) CREAR JWT
    const token = jwt.sign(
      {
        id: userFinal.id,
        email: userFinal.email,
      },
      process.env.JWT_SECRET || "claveultrasecreta",
      { expiresIn: "7d" }
    );

    // 8) RESPUESTA FINAL
    return res.json({
      ok: true,
      token,
      user: userFinal,
      carrito, 
    });

  } catch (err) {
    console.error("🔥 Error Google Login GENERAL:", err);
    return res.status(500).json({
      error: "Error login Google",
      detail: err.message,
    });
  }
};
