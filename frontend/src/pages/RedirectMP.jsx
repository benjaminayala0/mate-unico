import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function RedirectMP() {
  const location = useLocation();
  const navigate = useNavigate();

  const initPoint =
    location.state?.initPoint || sessionStorage.getItem("mp_init_point");

  useEffect(() => {
    if (initPoint) {
      // Guardamos por si el usuario vuelve atrás
      sessionStorage.setItem("mp_init_point", initPoint);
      window.location.href = initPoint;
    } else {
      navigate("/carrito");
    }
  }, [initPoint, navigate]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center">
      <div className="bg-white border rounded-2xl shadow-md px-10 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-6">
          Redirigiendo a MercadoPago
        </h1>
        <div className="w-24 h-24 border-4 border-[#d0b8a0] border-t-[#774d2a] rounded-full animate-spin mx-auto mb-6" />
        <p className="text-gray-600 text-sm">
          Por favor, no cierres esta ventana mientras te redirigimos al
          proveedor de pagos.
        </p>
      </div>
    </div>
  );
}
