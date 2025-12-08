import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import api from "../api/axios";

export default function Cart() {
  const navigate = useNavigate();
  
  const { 
    cart, 
    subtotal, 
    total,   
    coupon, 
    applyCoupon, 
    removeCoupon, 
    removeFromCart, 
    fetchCart 
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [loadingQty, setLoadingQty] = useState(false);

  const safeCart = Array.isArray(cart) ? cart : [];

  //  1. FILTRAR PRODUCTOS VÁLIDOS
  const productosValidos = safeCart.filter(item => item.stock >= item.cantidad);
  const productosSinStock = safeCart.filter(item => item.stock < item.cantidad);

  const hayProductosValidos = productosValidos.length > 0;
  const hayProductosSinStock = productosSinStock.length > 0;

  //  2. RECALCULAR TOTALES VISUALES 

  const subtotalReal = productosValidos.reduce((acc, item) => {
     const precio = Number(item.precio_unitario) + Number(item.costo_grabado);
     return acc + (precio * item.cantidad);
  }, 0);

  // Calcular envío y total sobre el subtotal REAL
  const ENVIO_GRATIS_MONTO = 150000;
  const COSTO_ENVIO_FIJO = 10000;
  const isFreeShipping = subtotalReal >= ENVIO_GRATIS_MONTO;
  const faltaParaEnvio = Math.max(0, ENVIO_GRATIS_MONTO - subtotalReal);
  
  const montoDescuento = coupon ? (subtotalReal * coupon.porcentaje) / 100 : 0;
  const costoEnvio = isFreeShipping ? 0 : COSTO_ENVIO_FIJO;
  const totalFinal = Math.max(0, subtotalReal - montoDescuento + costoEnvio);


  // Manejo de cantidad
  const handleChangeQty = async (item, nuevaCantidad) => {
    if (nuevaCantidad < 1 || loadingQty) return;
    setLoadingQty(true);
    try {
      await api.put(`/cart/update/${item.id}`, { cantidad: nuevaCantidad });
      await fetchCart(); 
    } catch (err) {
      console.error("Error stock:", err);
    } finally {
      setLoadingQty(false);
    }
  };

  // Cupón
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError("");
    const res = await applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.error);
      setTimeout(() => setCouponError(""), 3000);
    } else {
      setCouponInput(""); 
    }
  };

  // Render: Carrito Vacío
  if (safeCart.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center bg-white ">
        <div className="text-6xl mb-6 opacity-50">🛒</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-600 mb-8 text-lg">¿Aún no te decidiste? ¡Hay mates increíbles esperándote!</p>
        <Link 
          to="/productos" 
          className="bg-[#8B5E3C] text-white px-8 py-3 rounded-full hover:bg-[#6f4b30] transition shadow-lg font-medium transform hover:scale-105"
        >
          Ver productos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-white">
      
      <h1 className="text-3xl font-bold text-center mb-10 text-gray-900">Tu Carrito</h1>

      {/* STEPPER */}
      <div className="w-full max-w-3xl mx-auto mb-12 hidden md:grid grid-cols-3 gap-8">
        <div className="flex flex-col justify-end border-b-2 border-[#8B5E3C] pb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#8B5E3C] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">1</div>
                <span className="text-[#8B5E3C] font-bold text-sm">Carrito de la compra</span>
            </div>
        </div>
        <div className="flex flex-col justify-end border-b-2 border-gray-200 pb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
                <span className="text-gray-400 font-medium text-sm">Detalles de pago</span>
            </div>
        </div>
        <div className="flex flex-col justify-end border-b-2 border-gray-200 pb-3">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
                <span className="text-gray-400 font-medium text-sm">Orden completa</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* COLUMNA IZQUIERDA: PRODUCTOS */}
        <div className="lg:col-span-2">
          
          <div className="hidden md:grid grid-cols-12 border-b border-gray-200 pb-4 mb-6 font-bold text-gray-700 text-sm">
            <div className="col-span-6">Productos</div>
            <div className="col-span-3 text-center">Cantidad</div>
            <div className="col-span-3 text-right">Precio</div>
          </div>

          <div className="flex flex-col gap-8">
            {safeCart.map((item) => {
               const precioUnitario = Number(item.precio_unitario) + Number(item.costo_grabado);
               const subtotalItem = precioUnitario * item.cantidad;
               const sinStock = item.cantidad > item.stock;

               return (
                <div 
                  key={item.id} 
                  className={`grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-gray-100 pb-6 last:border-0 relative transition-opacity duration-300 ${sinStock ? 'opacity-60 bg-gray-50 rounded-lg p-2' : ''}`}
                >
                  
                  {/* Imagen + Info */}
                  <div className="md:col-span-6 flex gap-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0 relative">
                      <img 
                        src={item.imagen || "/placeholder.png"} 
                        alt={item.nombre} 
                        className={`w-full h-full object-cover ${sinStock ? 'grayscale' : ''}`}
                        onError={(e) => (e.target.src = "/placeholder.png")}
                      />
                      {sinStock && (
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                              <span className="bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">Sin Stock</span>
                          </div>
                      )}
                    </div>
                    <div className="flex flex-col justify-center">
                      <h3 className="font-bold text-gray-900 text-base mb-1">{item.nombre}</h3>
                      {item.color && <p className="text-xs text-gray-500 capitalize">Color: {item.color}</p>}
                      {item.grabado_texto && <p className="text-xs text-[#8B5E3C] font-medium mt-1">+ Grabado: "{item.grabado_texto}"</p>}
                      
                      {sinStock && (
                          <p className="text-red-600 text-xs font-bold mt-2 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              Stock insuficiente (Quedan: {item.stock})
                          </p>
                      )}

                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-400 text-sm mt-3 hover:text-red-500 flex items-center gap-1 transition-colors w-fit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-3 flex justify-center">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleChangeQty(item, item.cantidad - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition"
                          disabled={item.cantidad <= 1}
                        >
                          −
                        </button>
                        <span className={`text-base font-semibold w-4 text-center ${sinStock ? 'text-red-600' : ''}`}>{item.cantidad}</span>
                        <button 
                          onClick={() => handleChangeQty(item, item.cantidad + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-black transition"
                        >
                          +
                        </button>
                      </div>
                  </div>

                  {/* Precio */}
                  <div className="md:col-span-3 text-right">
                    <p className={`font-bold text-lg ${sinStock ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      ${subtotalItem.toLocaleString("es-AR")}
                    </p>
                    {item.cantidad > 1 && (
                        <p className="text-xs text-gray-400 mt-1">
                          ${precioUnitario.toLocaleString("es-AR")} c/u
                        </p>
                    )}
                  </div>

                </div>
               );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* CARD RESUMEN */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-lg p-8 ">
            <h2 className="text-xl font-bold mb-6 text-gray-900">Resumen</h2>
            
            <div className="space-y-4 text-sm text-gray-600 border-b border-gray-100 pb-6 mb-6">
              
              <div className="flex justify-between">
                <span>Subtotal (productos disponibles)</span>
                <span className="font-semibold text-gray-900">${subtotalReal.toLocaleString("es-AR")}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span>Descuento</span>
                <span className={`font-semibold ${coupon ? 'text-green-500' : 'text-gray-900'}`}>
                  {coupon 
                    ? `-$${((subtotalReal * coupon.porcentaje) / 100).toLocaleString("es-AR")}` 
                    : '$0'
                  }
                </span>
              </div>
              {coupon && (
                <div className="flex justify-end">
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded flex items-center gap-1">
                        🏷️ {coupon.codigo} ({coupon.porcentaje}%)
                    </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Envío</span>
                <span className={isFreeShipping ? "text-green-600 font-bold" : "text-gray-900"}>
                    {isFreeShipping ? "Gratis" : `$${COSTO_ENVIO_FIJO.toLocaleString("es-AR")}`}
                </span>
              </div>
              
              {!isFreeShipping && (
                  <p className="text-[10px] text-orange-500 mt-1 text-right">
                    Faltan <span className="font-bold">${faltaParaEnvio.toLocaleString("es-AR")}</span> para envío gratis.
                  </p>
              )}

              <div className="flex justify-between items-end pt-2 border-t border-gray-100 mt-2">
                <span className="text-lg font-bold text-gray-800">Total</span>
                <span className="text-3xl font-extrabold text-gray-900">${totalFinal.toLocaleString("es-AR")}</span>
              </div>
            </div>

            {/* MENSAJES DE ERROR INTELIGENTES */}
            {hayProductosSinStock && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm text-center border ${hayProductosValidos ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-red-50 border-red-200 text-red-700'}`}>
                    {hayProductosValidos 
                        ? "⚠️ Hay productos sin stock. Solo te cobraremos los disponibles."
                        : "⛔ Ningún producto tiene stock suficiente. Eliminálos para continuar."
                    }
                </div>
            )}

            <button 
              onClick={() => {
                  navigate("/checkout")
              }}
              disabled={!hayProductosValidos} 
              className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-md active:scale-[0.98]
                  ${!hayProductosValidos 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-[#8B5E3C] text-white hover:bg-[#6f4b30]'
                  }
              `}
            >
              Verificar
            </button>
          </div>

          {/* SECCIÓN CUPÓN  */}
          <div className="bg-white">
             {coupon ? (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4 flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-green-800 text-sm">{coupon.codigo}</p>
                    <p className="text-xs text-green-600">{coupon.porcentaje}% de descuento</p>
                  </div>
                </div>
                <button onClick={removeCoupon} className="text-xs font-semibold text-gray-400 hover:text-red-500 underline decoration-dotted">Quitar</button>
              </div>
            ) : (
              <div className="relative">
                <div className={`flex items-center border rounded-lg overflow-hidden transition-colors ${couponError ? 'border-red-300 ring-2 ring-red-100' : 'border-gray-300 hover:border-gray-400'}`}>
                  <div className="pl-3 text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg></div>
                  <input type="text" placeholder="Código de cupón" className="w-full px-3 py-3 outline-none text-sm text-gray-700 placeholder-gray-400" value={couponInput} onChange={(e) => setCouponInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()} />
                  <button onClick={handleApplyCoupon} className="px-6 font-semibold text-gray-700 hover:text-black hover:bg-gray-50 h-full border-l border-gray-200 transition-colors">Aplicar</button>
                </div>
                {couponError && <p className="text-xs text-red-500 mt-2 flex items-center gap-1 animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>{couponError}</p>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}