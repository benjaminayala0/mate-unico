import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Historial() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useState(() => JSON.parse(localStorage.getItem("user")));
  
  // Estado para el Modal
  const [selectedOrder, setSelectedOrder] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        const res = await api.get(`/usuarios/${user.id}/historial`);
        
        // Filtramos solo las aprobadas
        const todasLasOrdenes = res.data.ordenes || [];
        const aprobadas = todasLasOrdenes.filter(o => o.estado === 'aprobado');
        
        setOrders(aprobadas);
      } catch (err) {
        console.error("Error cargando historial:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const openModal = (orden) => setSelectedOrder(orden);
  const closeModal = () => setSelectedOrder(null);

  const fixImg = (img) => {
    if (!img) return "/placeholder.png";
    if (img.includes("http")) return img;
    return `${import.meta.env.VITE_API_URL}${img}`;
  };

  if (!user) return <div className="p-10 text-center">Debes iniciar sesión</div>;
  if (loading) return <div className="p-10 text-center">Cargando historial...</div>;

  return (
    <div className="w-full flex flex-col items-center py-12 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-10 text-gray-800">Historial de compras</h1>

      <div className="w-full max-w-6xl px-6">
        
        {orders.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 text-lg">No tienes compras aprobadas.</p>
            <button onClick={() => navigate("/productos")} className="mt-4 text-[#8B4513] underline">
                Ir al catálogo
            </button>
          </div>
        ) : (
            <>
                {/* CABECERA DE LA TABLA */}
                <div className="hidden md:grid grid-cols-[3fr,1fr,1fr,1fr,1.5fr] gap-x-6 
                                text-sm font-bold text-gray-500 uppercase tracking-wider 
                                border-b-2 border-gray-100 pb-4 mb-6">
                  <span className="pl-2">Producto</span>
                  <span>Fecha</span>
                  <span>Cant</span>
                  <span>Precio Unit.</span>
                  <span className="text-center">Estado / Acciones</span>
                </div>

                {/* LISTA DE PRODUCTOS (Estilo V1) */}
                <div className="flex flex-col gap-4">
                  {orders.map((order) => 
                    order.productos.map((prod, idx) => (
                        <div
                            key={`${order.id}-${idx}`}
                            className="grid grid-cols-1 md:grid-cols-[3fr,1fr,1fr,1fr,1.5fr] gap-4 md:gap-x-6 items-center 
                                       text-sm text-gray-700 border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow bg-white"
                        >
                            {/* 1. PRODUCTO (Foto + Nombre + Grabado Opcional) */}
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-md border overflow-hidden flex-shrink-0">
                                    <img 
                                        src={fixImg(prod.imagen)} 
                                        alt={prod.nombre} 
                                        className="w-full h-full object-cover"
                                        loading="lazy" 
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-gray-900 text-sm md:text-base leading-tight">
                                        {prod.nombre}
                                    </span>
                                    
                                    {/* LÓGICA : SOLO aparece si hay grabado. Si no, nada */}
                                    {prod.grabado_texto && (
                                        <span className="text-xs text-[#8B4513] bg-yellow-50 px-2 py-0.5 rounded mt-1 border border-yellow-100 w-fit">
                                            ✏️ "{prod.grabado_texto}"
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 2. FECHA */}
                            <div className="text-gray-500">
                                <span className="md:hidden font-bold mr-2">Fecha:</span>
                                {new Date(order.fecha).toLocaleDateString("es-AR")}
                            </div>

                            {/* 3. CANTIDAD */}
                            <div className="font-medium">
                                <span className="md:hidden font-bold mr-2">Cant:</span>
                                {prod.cantidad}
                            </div>

                            {/* 4. PRECIO UNITARIO */}
                            <div className="font-bold text-gray-900">
                                <span className="md:hidden font-bold mr-2">Precio:</span>
                                ${Number(prod.precio).toLocaleString("es-AR")}
                            </div>

                            {/* 5. ESTADO Y BOTONES */}
                            <div className="flex flex-col items-center gap-2">
                                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200 uppercase tracking-wide">
                                    {order.estado}
                                </span>

                                <div className="flex gap-2">
                                    {/* Botón Ver Detalle */}
                                    <button 
                                        onClick={() => openModal(order)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition"
                                        title="Ver detalle total de la orden"
                                    >
                                        📄 Detalle
                                    </button>

                                    {/* Botón Seguir Envío */}
                                    <button 
                                        onClick={() => navigate(`/seguimiento/${order.id}`)}
                                        className="px-3 py-1.5 bg-[#8B4513] text-white rounded text-xs font-medium hover:bg-[#6f3c21] flex items-center gap-1 transition shadow-sm"
                                    >
                                        🚚 Envío
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                  )}
                </div>
            </>
        )}
      </div>

      {/* MODAL DE DETALLE (POPUP) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-[#774d2a] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Detalle Orden #{selectedOrder.id}</h3>
              <button onClick={closeModal} className="text-white/80 hover:text-white text-3xl leading-none">&times;</button>
            </div>

            {/* Body Modal */}
            <div className="p-6 max-h-[70vh] overflow-y-auto bg-gray-50">
              <div className="mb-4 text-sm text-gray-600 flex justify-between border-b pb-2">
                  <span>Fecha de compra:</span>
                  <span className="font-medium">{new Date(selectedOrder.fecha).toLocaleDateString("es-AR")}</span>
              </div>

              {/*MOSTRAR DIRECCIÓN DE ENVÍO */}
              <div className="mb-4 bg-white p-3 rounded border border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Dirección de envío</p>
                <p className="text-sm text-gray-800 font-medium">
                  {selectedOrder.direccion_envio}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedOrder.ciudad_envio}, {selectedOrder.provincia_envio} (CP: {selectedOrder.codigo_postal_envio})
                </p>
              </div>

              {/* Lista en Modal */}
              <div className="space-y-3">
                {selectedOrder.productos.map((prod, idx) => (
                    <div key={idx} className="flex gap-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                            <img src={fixImg(prod.imagen)} 
                            alt={prod.nombre} 
                            className="w-full h-full object-cover"
                            loading="lazy"
                             />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <p className="text-sm font-bold text-gray-800 leading-tight">{prod.nombre}</p>
                            <p className="text-xs text-gray-500 mt-1">Cantidad: {prod.cantidad}</p>
                            
                            {/* GRABADO EN MODAL: Solo si existe */}
                            {prod.grabado_texto && (
                                <p className="text-xs text-[#8B4513] italic mt-1">✏️ "{prod.grabado_texto}"</p>
                            )}
                        </div>
                        <div className="flex items-center text-sm font-bold text-[#8B4513]">
                            ${Number(prod.precio).toLocaleString("es-AR")}
                        </div>
                    </div>
                ))}
              </div>
              
             {/* 2. SECCIÓN DE TOTALES (CUPÓN + TOTAL) */}
              
              <div className="mt-6 pt-4 border-t border-gray-300 ">

                {/* A) MOSTRAR CUPÓN (Solo si existe) */}
                {selectedOrder.cupon_codigo && (
                <div className="flex justify-between items-center mb-2 text-sm animate-pulse">
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    🏷️ Cupón aplicado ({selectedOrder.cupon_codigo})
                  </span>
                  <span className="text-green-600 font-bold">
                    -{selectedOrder.cupon_porcentaje}% OFF
                  </span>
                </div>
              )}
                {/* B) TOTAL PAGADO FINAL */}
                  <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-bold text-lg">Total Pagado</span>
                  <span className="text-2xl font-bold text-[#774d2a]">
                   ${Number(selectedOrder.monto_total || selectedOrder.montoTotal || 0).toLocaleString("es-AR")}
                  </span>
              </div>
            </div>
          </div>

            <div className="bg-white px-6 py-4 flex justify-end">
                <button onClick={closeModal} className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 font-medium text-sm">
                    Cerrar
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}