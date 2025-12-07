import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function Seguimiento() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [orden, setOrden] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados posibles para el Stepper
  // 1: Aprobado (Pago), 2: Preparacion, 3: Camino, 4: Entregado
  const getStep = (estadoEnvio) => {
    switch (estadoEnvio) {
      case "preparacion": return 2;
      case "camino": return 3;
      case "entregado": return 4;
      default: return 1; // Solo pago aprobado
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if(user) {
        api.get(`/usuarios/${user.id}/historial`).then(res => {
            const found = res.data.ordenes.find(o => o.id == id);
            setOrden(found);
            setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div className="p-10 text-center">Cargando seguimiento...</div>;
  if (!orden) return <div className="p-10 text-center">Orden no encontrada.</div>;

  const currentStep = getStep(orden.estado_envio);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="text-gray-500 mb-6 hover:underline">
        ← Volver
      </button>

      <div className="bg-white border rounded-xl shadow-sm p-8">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Seguimiento de envío</h1>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm font-mono">
                #{orden.id}
            </span>
        </div>

        {orden.codigo_seguimiento && (
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-8 text-sm">
                Código de seguimiento: <strong>{orden.codigo_seguimiento}</strong>
            </div>
        )}

        {/* STEPPER VERTICAL */}
        <div className="relative border-l-2 border-gray-200 ml-4 space-y-10">
            
            {/* PASO 1: PAGO APROBADO */}
            <div className="relative pl-8">
                <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${currentStep >= 1 ? 'bg-green-500 border-green-500' : 'bg-white border-gray-300'}`}></div>
                <h3 className={`font-bold ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'}`}>Pago Aprobado</h3>
                <p className="text-sm text-gray-500">Hemos recibido tu pago correctamente.</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(orden.fecha).toLocaleDateString()}</p>
            </div>

            {/* PASO 2: EN PREPARACIÓN */}
            <div className="relative pl-8">
                <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${currentStep >= 2 ? 'bg-[#774d2a] border-[#774d2a]' : 'bg-white border-gray-300'}`}></div>
                <h3 className={`font-bold ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'}`}>En Preparación</h3>
                <p className="text-sm text-gray-500">Estamos armando tu paquete con cuidado.</p>
            </div>

            {/* PASO 3: EN CAMINO */}
            <div className="relative pl-8">
                <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${currentStep >= 3 ? 'bg-[#774d2a] border-[#774d2a]' : 'bg-white border-gray-300'}`}></div>
                <h3 className={`font-bold ${currentStep >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>En Camino</h3>
                <p className="text-sm text-gray-500">Tu pedido ya fue despachado por el correo.</p>
            </div>

            {/* PASO 4: ENTREGADO */}
            <div className="relative pl-8">
                <div className={`absolute -left-[9px] w-4 h-4 rounded-full border-2 ${currentStep >= 4 ? 'bg-green-600 border-green-600' : 'bg-white border-gray-300'}`}></div>
                <h3 className={`font-bold ${currentStep >= 4 ? 'text-gray-900' : 'text-gray-400'}`}>Entregado</h3>
                <p className="text-sm text-gray-500">¡Que disfrutes tus mates!</p>
            </div>

        </div>
      </div>
    </div>
  );
}