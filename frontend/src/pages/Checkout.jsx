import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useCart } from "../context/CartContext"; 

export default function Checkout() {
  const navigate = useNavigate();

  // Traemos datos del contexto (Carrito, Cupón)
  const { cart, coupon } = useCart();

  const [user, setUser] = useState(null);
  const [direcciones, setDirecciones] = useState([]);
  const [selectedDireccionId, setSelectedDireccionId] = useState(null);

  // "perfil" , "guardada" , "nueva"
  const [selectedMode, setSelectedMode] = useState("perfil");

  const [newAddress, setNewAddress] = useState({
    calle: "",
    numero: "",
    ciudad: "",
    provincia: "",
    pais: "",
    codigo_postal: "",
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 1. LÓGICA DE STOCK Y TOTALES REALES
  const safeCart = Array.isArray(cart) ? cart : [];

  // Filtramos qué productos SÍ se pueden vender
  const productosValidos = safeCart.filter(item => item.stock >= item.cantidad);
  const hayProductosValidos = productosValidos.length > 0;

  // Recalculamos el subtotal solo con los válidos
  const subtotalReal = productosValidos.reduce((acc, item) => {
     const precio = Number(item.precio_unitario) + Number(item.costo_grabado);
     return acc + (precio * item.cantidad);
  }, 0);

  // Cálculos de Descuento y Envío sobre el subtotal REAL
  const ENVIO_GRATIS_LIMITE = 150000;
  const COSTO_ENVIO_FIJO = 10000;
  
  const montoDescuento = coupon ? (subtotalReal * coupon.porcentaje) / 100 : 0;
  const isFreeShipping = subtotalReal >= ENVIO_GRATIS_LIMITE;
  const costoEnvio = isFreeShipping ? 0 : COSTO_ENVIO_FIJO;
  
  // Total Final a cobrar
  const totalFinal = Math.max(0, subtotalReal - montoDescuento + costoEnvio);


  // CARGAR DATA INICIAL
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
          navigate("/login");
          return;
        }
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // Direcciones guardadas
        const dirRes = await api.get("/domicilio", {
          params: { usuarioId: parsedUser.id },
        });

        const dirs = dirRes.data || [];
        setDirecciones(dirs);

        const hasPerfilAddress =
          parsedUser.domicilio &&
          parsedUser.ciudad &&
          parsedUser.provincia &&
          parsedUser.codigo_postal;

        let initialMode = "nueva";
        let initialDirId = null;

        if (hasPerfilAddress) {
          initialMode = "perfil";
        } else if (dirs.length > 0) {
          initialMode = "guardada";
          initialDirId = dirs[0].id;
        }

        setSelectedMode(initialMode);
        if (initialDirId) setSelectedDireccionId(initialDirId);

        setError("");
      } catch (err) {
        console.error("Error cargando checkout:", err.response?.data || err);
        setError("No se pudo cargar la información del checkout.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const hasPerfilAddress =
    user &&
    user.domicilio &&
    user.ciudad &&
    user.provincia &&
    user.codigo_postal;


  // HANDLERS DE FORMULARIO

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("¿Eliminar esta dirección?")) return;

    try {
      await api.delete(`/domicilio/${id}`, {
        params: { usuarioId: user.id },
      });

      const dirRes = await api.get("/domicilio", {
        params: { usuarioId: user.id },
      });

      setDirecciones(dirRes.data);
      setSelectedDireccionId(null);
      alert("Dirección eliminada con éxito");
    } catch (err) {
      console.error("Error eliminando dirección:", err);
      const msg =
        err.response?.data?.error || "No se pudo eliminar la dirección.";
      alert(msg);
    }
  };

  // ENVIAR CHECKOUT
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError("");

      // Validación de stock antes de enviar
      if (!hayProductosValidos) {
          setError("No tienes productos con stock suficiente para continuar.");
          setSubmitting(false);
          return;
      }

      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        navigate("/login");
        return;
      }
      const currentUser = JSON.parse(storedUser);

      //  Agregamos el cupón al payload si existe
      let payload = { 
          clienteId: currentUser.id,
          cuponId: coupon ? coupon.id : null 
      };

      // PERFIL
      if (selectedMode === "perfil") {
        const perfilDireccion = {
          calle: currentUser.domicilio || "",
          numero: "S/N",
          ciudad: currentUser.ciudad || "",
          provincia: currentUser.provincia || "",
          pais: "Argentina",
          codigo_postal: currentUser.codigo_postal || "",
        };
        payload = { ...payload, nuevaDireccion: perfilDireccion };
      }

      // GUARDADA
      else if (selectedMode === "guardada") {
        if (!selectedDireccionId) {
          setError("Seleccioná una dirección de envío.");
          setSubmitting(false);
          return;
        }
        payload = { ...payload, domicilioId: selectedDireccionId };
      }

      // NUEVA
      else if (selectedMode === "nueva") {
        if (
          !newAddress.calle ||
          !newAddress.numero ||
          !newAddress.ciudad ||
          !newAddress.provincia ||
          !newAddress.pais ||
          !newAddress.codigo_postal
        ) {
          setError("Completá todos los campos de la dirección.");
          setSubmitting(false);
          return;
        }
        payload = { ...payload, nuevaDireccion: newAddress };
      }

      // Enviar
      const res = await api.post("/checkout/create", payload);

      const { init_point, orderId } = res.data;

      localStorage.setItem("lastOrderId", orderId);

      // Redirigir a Mercado Pago
      if (init_point) {
          window.location.href = init_point;
      }

    } catch (err) {
      console.error("Error procesando el checkout:", err.response?.data || err);
      setError("Ocurrió un error al iniciar el pago. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };


  // RENDER
 
  if (loading) {
    return <div className="py-10 text-center">Cargando checkout...</div>;
  }

  // Usamos 'cart' del contexto
  if (!safeCart || safeCart.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-semibold mb-4">Check Out</h1>
        <p className="text-gray-600 mb-6">Tu carrito está vacío.</p>
        <button
          onClick={() => navigate("/productos")}
          className="px-6 py-2 bg-[#774d2a] text-white rounded-lg hover:bg-[#5f3c21] transition"
        >
          Ver productos
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      
      {/* HEADER + STEPPER */}
      <div className="text-center mb-10 flex flex-col items-center">
        <h1 className="text-2xl font-semibold mb-8">Check Out</h1>

        <div className="w-full max-w-3xl grid grid-cols-3 gap-4 md:gap-8 text-left">
            
            {/* Paso 1: Carrito */}
            <div 
                onClick={() => navigate("/carrito")}
                className="flex flex-col justify-end border-b-2 border-green-500 pb-3 cursor-pointer group hover:opacity-75 transition-opacity"
                title="Volver al carrito"
            >
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <span className="text-green-600 font-semibold text-xs md:text-sm group-hover:underline">Carrito de la compra</span>
                </div>
            </div>

            {/* Paso 2: Detalles (ACTIVO) */}
            <div className="flex flex-col justify-end border-b-2 border-[#8B5E3C] pb-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-[#8B5E3C] rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm shadow-md">
                        2
                    </div>
                    <span className="text-[#8B5E3C] font-bold text-xs md:text-sm">Detalles de pago</span>
                </div>
            </div>

            {/* Paso 3: Orden Completa (PENDIENTE) */}
            <div className="flex flex-col justify-end border-b-2 border-gray-200 pb-3">
                <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-xs md:text-sm">
                        3
                    </div>
                    <span className="text-gray-400 font-medium text-xs md:text-sm">Orden completa</span>
                </div>
            </div>

        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* IZQUIERDA: FORMULARIOS */}
        <div className="flex-1 flex flex-col gap-6">

          {/* TARJETA DIRECCIONES */}
          <section className="bg-white border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Dirección de envío</h2>

            {/* PERFIL */}
            {hasPerfilAddress && (
              <label
                className={`border rounded-lg px-4 py-3 cursor-pointer mb-4 flex items-center justify-between text-sm ${
                  selectedMode === "perfil"
                    ? "border-[#774d2a] bg-[#f7f2ee]"
                    : "border-gray-200"
                }`}
              >
                <div>
                  <p className="font-medium">Usar mis datos de la cuenta</p>
                  <p className="text-xs text-gray-600">
                    {user.domicilio}, {user.ciudad}, {user.provincia},{" "}
                    {user.codigo_postal}
                  </p>
                </div>

                <input
                  type="radio"
                  name="direccion_modo"
                  checked={selectedMode === "perfil"}
                  onChange={() => {
                    setSelectedMode("perfil");
                    setSelectedDireccionId(null);
                  }}
                />
              </label>
            )}

            {/* GUARDADAS */}
            {direcciones.length > 0 && (
              <>
                <p className="text-sm text-gray-600 mb-2">
                  Elegí una dirección guardada:
                </p>

                <div className="flex flex-col gap-2 mb-4">
                  {direcciones.map((dir) => (
                    <label
                      key={dir.id}
                      className={`border rounded-lg px-4 py-3 cursor-pointer text-sm flex items-center justify-between ${
                        selectedMode === "guardada" &&
                        selectedDireccionId === dir.id
                          ? "border-[#774d2a] bg-[#f7f2ee]"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-medium">
                          {dir.calle} {dir.numero}
                        </div>
                        <div className="text-gray-600 text-xs">
                          {dir.ciudad}, {dir.provincia}, {dir.pais} (
                          {dir.codigo_postal})
                        </div>
                        {dir.telefono && (
                          <div className="text-gray-500 text-xs">
                            Tel: {dir.telefono}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end ml-4 gap-1">
                        <input
                          type="radio"
                          name="direccion_modo"
                          checked={
                            selectedMode === "guardada" &&
                            selectedDireccionId === dir.id
                          }
                          onChange={() => {
                            setSelectedMode("guardada");
                            setSelectedDireccionId(dir.id);
                          }}
                        />

                        <button
                          className="text-[11px] text-red-500 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAddress(dir.id);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {/* NUEVA DIRECCIÓN */}
            <div className="flex items-center gap-2 mt-2 mb-3">
              <input
                type="radio"
                name="direccion_modo"
                checked={selectedMode === "nueva"}
                onChange={() => {
                  setSelectedMode("nueva");
                  setSelectedDireccionId(null);
                }}
              />
              <label className="text-sm text-gray-700">
                Usar una dirección nueva
              </label>
            </div>

            {selectedMode === "nueva" && (
              <div className="mt-2 space-y-3 animate-fade-in">
                <div>
                  <label className="block text-xs font-medium mb-1">Calle Dirección *</label>
                  <input type="text" name="calle" value={newAddress.calle} onChange={handleAddressChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Calle" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Número *</label>
                  <input type="text" name="numero" value={newAddress.numero} onChange={handleAddressChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Número" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">País *</label>
                  <input type="text" name="pais" value={newAddress.pais} onChange={handleAddressChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Argentina" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Ciudad *</label>
                  <input type="text" name="ciudad" value={newAddress.ciudad} onChange={handleAddressChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Ciudad" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium mb-1">Provincia *</label>
                    <input type="text" name="provincia" value={newAddress.provincia} onChange={handleAddressChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="Provincia" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Código postal *</label>
                    <input type="text" name="codigo_postal" value={newAddress.codigo_postal} onChange={handleAddressChange} className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="CP" />
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* MÉTODO DE PAGO */}
          <section className="bg-white border rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Método de pago</h2>
            <label className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer text-sm border-[#774d2a] bg-[#f7f2ee]">
              <span className="font-medium text-gray-800">Mercado Pago</span>
              <input type="radio" defaultChecked className="text-[#8B5E3C] focus:ring-[#8B5E3C]" />
            </label>
          </section>

          {error && <p className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting || !hayProductosValidos} // BLOQUEO SI NO HAY STOCK VÁLIDO
            className={`mt-4 w-full py-3 rounded-lg transition text-sm font-bold
                ${submitting || !hayProductosValidos 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-[#774d2a] text-white hover:bg-[#5f3c21]'
                }
            `}
          >
            {submitting ? "Procesando..." : "Continuar con la compra"}
          </button>
        </div>

        {/* RESUMEN (DERECHA) */}
        <aside className="w-full lg:w-80 bg-white border rounded-xl shadow-sm p-6 h-fit">
          <h2 className="text-lg font-semibold mb-4">Resumen del pedido</h2>

          <div className="flex flex-col gap-4 max-h-80 overflow-y-auto mb-4 pr-2 custom-scrollbar">
            {safeCart.map((item) => {
              const precioUnitario = Number(item.precio_unitario) + Number(item.costo_grabado);
              const subtotalItem = precioUnitario * item.cantidad;
              
              // Detección de Stock
              const sinStock = item.cantidad > item.stock;

              return (
                <div key={item.id} className={`flex gap-3 text-sm border-b border-gray-100 pb-3 last:border-0 ${sinStock ? 'opacity-50' : ''}`}>
                  <div className="w-16 h-16 rounded-md border overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    <img
                      src={item.imagen}
                      alt={item.nombre}
                      className={`w-full h-full object-cover ${sinStock ? 'grayscale' : ''}`}
                      onError={(e) => (e.target.src = "/placeholder.png")}
                    />
                    {sinStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <span className="bg-red-600 text-white text-[9px] px-1 rounded font-bold uppercase">Sin Stock</span>
                        </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <p className={`font-medium line-clamp-2 ${sinStock ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                        {item.nombre}
                    </p>
                    {item.grabado_texto && (
                      <p className="text-xs text-gray-500 italic">"{item.grabado_texto}"</p>
                    )}
                    <div className="flex items-center justify-between mt-1 text-xs text-gray-600">
                      <span>Cant: {item.cantidad}</span>
                      <span className="font-semibold">
                         {/* Si no hay stock, mostramos $0 en la vista */}
                         {sinStock ? "$0" : `$${subtotalItem.toLocaleString("es-AR")}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3 text-sm space-y-2">
            
            <div className="flex justify-between">
              <span>Subtotal (disponibles)</span>
              {/* Mostramos subtotal real calculado */}
              <span>${subtotalReal.toLocaleString("es-AR")}</span>
            </div>

            {/* DESCUENTO */}
            <div className="flex justify-between items-center h-5">
                <span>Descuento</span>
                <span className={coupon ? 'text-green-500 font-bold' : 'text-gray-400'}>
                  {coupon ? `-$${montoDescuento.toLocaleString("es-AR")}` : '$0'}
                </span>
            </div>
            {coupon && (
                <div className="flex justify-end">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                        🏷️ {coupon.codigo} ({coupon.porcentaje}%)
                    </span>
                </div>
            )}

            {/* ENVÍO CON PRECIO  */}
            <div className="flex justify-between">
              <span>Envío</span>
              <span className={isFreeShipping ? "text-green-600 font-bold" : "text-gray-900"}>
                  {isFreeShipping ? "Gratis" : `$${COSTO_ENVIO_FIJO.toLocaleString("es-AR")}`}
              </span>
            </div>
            
            {!isFreeShipping && (
                <p className="text-[10px] text-orange-500 mt-1 text-right">
                  Faltan <span className="font-bold">${Math.max(0, ENVIO_GRATIS_LIMITE - subtotalReal).toLocaleString("es-AR")}</span> para envío gratis.
                </p>
            )}

            <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-100 mt-2">
              <span>Total</span>
              {/*  Mostramos total real calculado */}
              <span>${totalFinal.toLocaleString("es-AR")}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}