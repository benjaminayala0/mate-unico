import React, { useEffect, useState, useRef } from "react"; 
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/axios";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [orderId, setOrderId] = useState(null);
  const [ordenData, setOrdenData] = useState(null); 
  const [purchasedItems, setPurchasedItems] = useState([]); 
  const [loading, setLoading] = useState(true);

  const { clearCart } = useCart();
  
  const processed = useRef(false);

  const agruparProductos = (items) => {
    const agrupados = {};
    items.forEach((item) => {
      const clave = `${item.producto_id}-${item.grabado_texto || "sin-grabado"}`;
      if (agrupados[clave]) {
        agrupados[clave].cantidad += Number(item.cantidad);
      } else {
        agrupados[clave] = { ...item, cantidad: Number(item.cantidad) };
      }
    });
    return Object.values(agrupados);
  };

  useEffect(() => {
    if (processed.current) return;
    processed.current = true; 

    const extRef = searchParams.get("external_reference");
    const lastOrderId = localStorage.getItem("lastOrderId");
    
    let finalId = extRef || lastOrderId;
    if (finalId && finalId.includes(":")) {
        finalId = finalId.split(":")[0];
    }

    setOrderId(finalId || "—");

    if (finalId) {
      if (extRef) {
        clearCart();
        localStorage.removeItem("lastOrderId");
      }

      api.get(`/orders/${finalId}`)
        .then((res) => {
          const itemsRaw = res.data.items || [];
          const itemsAgrupados = agruparProductos(itemsRaw);
          setPurchasedItems(itemsAgrupados);
          setOrdenData(res.data.orden);
        })
        .catch((err) => console.error("Error cargando orden:", err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); 

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-ES", {
      month: "long", day: "numeric", year: "numeric",
    }).format(date);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col items-center">

      {/*  TÍTULO AGREGADO */}
      <h2 className="text-3xl font-bold text-gray-900 mb-8 hidden md:block">
       Completado!
      </h2>
      
      {/* STEPPER */}
      <div className="w-full max-w-3xl mb-12 hidden md:grid grid-cols-3 gap-8">
            
        {/* Paso 1: Carrito */}
        <div className="flex flex-col justify-end border-b-2 border-green-500 pb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span className="text-green-600 font-semibold text-sm">Carrito de la compra</span>
            </div>
        </div>

        {/* Paso 2: Detalles */}
        <div className="flex flex-col justify-end border-b-2 border-green-500 pb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <span className="text-green-600 font-semibold text-sm">Detalles de pago</span>
            </div>
        </div>

        {/* Paso 3: Orden Completa */}
        <div className="flex flex-col justify-end border-b-2 border-gray-800 pb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#8B5E3C] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                    3
                </div>
                <span className="text-gray-900 font-bold text-sm">Orden completa</span>
            </div>
        </div>

      </div>

      {/* Tarjeta de Éxito */}
      <div className="bg-white px-8 py-12 text-center w-full max-w-lg shadow-lg rounded-xl relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600"></div>

        <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center shadow-md">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-800 mb-2">¡Gracias! 🎉</h1>
        
        <p className="text-xl text-gray-600 mb-10">
          Su compra ha sido realizada 
          <span className="text-green-600 font-bold"> correctamente</span>.
        </p>

        {/* FOTOS */}
        <div className="flex justify-center gap-6 mb-10 flex-wrap">
          {loading ? (
             <div className="w-20 h-20 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
             purchasedItems.map((item, index) => (
               <div key={index} className="relative group">
                 <div className="w-20 h-20 bg-gray-50 rounded-lg border overflow-hidden shadow-sm">
                   {item.imagen ? (
                     <img src={item.imagen} alt={item.nombre} className="w-full h-full object-cover"/>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">Sin foto</div>
                   )}
                 </div>
                 <div className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md">
                    {item.cantidad}
                 </div>
               </div>
             ))
          )}
        </div>

        {/* RESUMEN */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8 text-sm space-y-3 text-left max-w-xs mx-auto border border-gray-100">
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Código de pedido:</span>
                <span className="font-bold text-gray-900">#{orderId}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Fecha:</span>
                <span className="font-bold text-gray-900">{ordenData ? formatDate(ordenData.fecha_creacion) : "-"}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Total:</span>
                <span className="font-bold text-gray-900 text-lg text-[#8B5E3C]">
                    ${ordenData ? Number(ordenData.monto_total).toLocaleString("es-AR") : "0"}
                </span>
            </div>
            <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Método de pago:</span>
                <span className="font-bold text-gray-900">Mercado Pago</span>
            </div>
        </div>

        <button
          onClick={() => navigate("/historial")}
          className="px-8 py-3 bg-[#8B5E3C] text-white font-medium rounded-full hover:bg-[#6f4b30] transition shadow-md w-full sm:w-auto"
        >
          Historial de compras
        </button>

      </div>
    </div>
  );
}