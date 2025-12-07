import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../api/axios"; 

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0); 
  const [subtotal, setSubtotal] = useState(0);
  const [coupon, setCoupon] = useState(null);

  const getClienteId = () => {
     try {
       const user = JSON.parse(localStorage.getItem("user")); 
       return user?.id;
     } catch (e) { return null; }
  };

  const fetchCart = useCallback(async () => {
    try {
      const clienteId = getClienteId();
      if(!clienteId) return;

      const res = await api.get(`/cart?clienteId=${clienteId}&t=${Date.now()}`);
      
      const items = Array.isArray(res.data.items) ? res.data.items : [];
      
      setCart(items);
      setSubtotal(res.data.precio_total || 0);

    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]); 
    }
  }, []);

  // (Descuentos + Envio)
  useEffect(() => {
    let montoDescuento = 0;
    let costoEnvio = 0;

    // 1. Calcular Descuento (Si hay cupón activo)
    if (coupon && coupon.porcentaje) {
        montoDescuento = (subtotal * coupon.porcentaje) / 100;
    }

    // 2. Calcular Envío 

    if (subtotal >= 150000) {
        costoEnvio = 0; 
    } else {
        costoEnvio = 0; 
    }

    // Total Final 
    const final = Math.max(0, subtotal - montoDescuento + costoEnvio);
    setTotal(final);

  }, [subtotal, coupon]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // FUNCIONES DE CUPÓN
  const applyCoupon = async (codigo) => {
      try {
          const clienteId = getClienteId();
          if (!clienteId) return { success: false, error: "Inicia sesión para usar cupones" };

          const res = await api.post('/coupons/validate', { codigo, clienteId });
          
          setCoupon({
              id: res.data.id,
              codigo: res.data.codigo,
              porcentaje: res.data.porcentaje 
          });
          return { success: true };
      } catch (err) {
          setCoupon(null);
          return { success: false, error: err.response?.data?.error || "Cupón no válido" };
      }
  };

  const removeCoupon = () => setCoupon(null);

  // AGREGAR PRODUCTO
  const addToCart = async (item) => {
    try {
      const clienteId = getClienteId();
      
      const body = {
        clienteId,
        productoId: item.id,
        cantidad: item.cantidad || 1,
        color: item.color,
        // Mapeamos lo que llega del componente a lo que espera el backend
        grabado_texto: item.grabado_texto || null, 
        costo_grabado: item.costo_grabado || 0
      };

      await api.post('/cart/add', body);
      
      // Actualizamos la vista
      await fetchCart(); 
      
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error; 
    }
  };

  // ELIMINAR PRODUCTO
  const removeFromCart = async (itemId) => {
    try {
        await api.delete(`/cart/remove/${itemId}`);
        await fetchCart();
    } catch (error) {
        console.error("Error removing item:", error);
    }
  };

  // LIMPIAR CARRITO
  const clearCart = async () => {
    try {
        const clienteId = getClienteId();
        await api.delete(`/cart/clear?clienteId=${clienteId}`);
        setCart([]);
        setSubtotal(0);
        setTotal(0);
        setCoupon(null); 
    } catch (error) {
        console.error("Error clearing cart:", error);
    }
  };

  return (
    <CartContext.Provider
      value={{ 
          cart, 
          subtotal, 
          total, 
          coupon, 
          applyCoupon, 
          removeCoupon, 
          addToCart, 
          removeFromCart, 
          clearCart, 
          fetchCart 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}