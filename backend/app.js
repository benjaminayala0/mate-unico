import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// IMPORTAR TODAS LAS RUTAS
import testRoutes from "./src/routes/test.routes.js";
import productRoutes from "./src/routes/product.routes.js";
import cartRoutes from "./src/routes/cart.routes.js";
import couponRoutes from "./src/routes/coupon.routes.js";
import shippingRoutes from "./src/routes/shipping.routes.js";
import authRoutes from "./src/routes/auth.routes.js";
import reviewRoutes from "./src/routes/review.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import domicilioRoutes from "./src/routes/domicilio.routes.js";
import checkoutRoutes from "./src/routes/checkout.routes.js";
import orderRoutes from "./src/routes/order.routes.js";

//  Configuración de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB
import { connectDB } from "./src/db.js";

// CONFIG
dotenv.config();
connectDB();

const app = express();

// CORS CONFIG 
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.BACKEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); 

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("❌ ORIGEN BLOQUEADO POR CORS:", origin);
      return callback(new Error("No permitido por CORS"), false);
    },
    credentials: true,
  })
);

app.use(express.json());

// RUTAS
app.get("/", (req, res) => {
  res.send("API Mate Unico funcionando");
});

app.use("/api/products", productRoutes);
app.use("/api/productos", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/shipping", shippingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/test", testRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/domicilio", domicilioRoutes);
app.use("/api/checkout", checkoutRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));