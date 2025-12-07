import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Layout principal
import MainLayout from "./layout/MainLayout";

// Páginas
import Home from "./pages/home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import CompletarPerfil from "./pages/CompletarPerfil.jsx";
import Cuenta from "./pages/Cuenta.jsx";
import Historial from "./pages/Historial.jsx";
import Checkout from "./pages/Checkout.jsx";
import RedirectMP from "./pages/RedirectMP.jsx";
import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentFailure from "./pages/PaymentFailure.jsx";
import Seguimiento from "./pages/Seguimiento";


// CONTEXT DEL CARRITO
import { CartProvider } from "./context/CartContext.jsx";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>

    {/* ENVOLVEMOS TODA LA APP EN CARTPROVIDER */}
    <CartProvider>
      <BrowserRouter>
        <Routes>

          {/* Todas las páginas comparten el layout */}
          <Route path="/" element={<MainLayout />}>

            {/* HOME */}
            <Route index element={<Home />} />

            {/* PRODUCTOS */}
            <Route path="productos" element={<Products />} />

            {/* DETALLE DE PRODUCTO */}
            <Route path="producto/:id" element={<ProductDetail />} />

            {/* CARRITO */}
            <Route path="carrito" element={<Cart />} />

            {/* CHECKOUT */}
            <Route path="/checkout" element={<Checkout />} />

            {/* REDIRECCIÓN A MERCADOPAGO */}
             <Route path="/checkout/redirect" element={<RedirectMP />} />

            {/* ÉXITO DE PAGO */}
            <Route path="/checkout/success" element={<PaymentSuccess />} />

            {/* FALLA DE PAGO */}
            <Route path="/checkout/failure" element={<PaymentFailure />} />
            
            {/* LOGIN */}
            <Route path="login" element={<Login />} />

            {/* COMPLETAR PERFIL */}
            <Route path="/completar-perfil" element={<CompletarPerfil />} />

            {/* PERFIL */}
            <Route path="perfil" element={<Cuenta />} />

            {/* HISTORIAL */}
            <Route path="historial" element={<Historial />} />

            {/* SEGUIMIENTO DE ENVÍO */}
           <Route path="/seguimiento/:id" element={<Seguimiento />} />
           
          </Route>

        </Routes>
      </BrowserRouter>
    </CartProvider>

  </React.StrictMode>
);
