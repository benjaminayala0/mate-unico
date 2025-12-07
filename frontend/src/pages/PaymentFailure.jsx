import React from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentFailure() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 flex flex-col items-center">
      <div className="bg-white border rounded-2xl shadow-md px-10 py-16 text-center">
        <h1 className="text-2xl font-semibold mb-4">
          Error de Pago
        </h1>
        <p className="text-lg mb-6">
          Su compra ha sido <span className="text-red-600 font-semibold">rechazada</span>.
        </p>
        <p className="text-gray-600 text-sm mb-8">
          Vuelva a intentarlo o revise los datos de su medio de pago.
        </p>

        <button
          onClick={() => navigate("/carrito")}
          className="px-6 py-2 bg-[#774d2a] text-white rounded-lg hover:bg-[#5f3c21] transition text-sm"
        >
          Ir a Carrito
        </button>
      </div>
    </div>
  );
}
