import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoMateUnico from "../assets/home/logo-mate-unico.png";

// CONTEXTO DEL CARRITO
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [showMenu, setShowMenu] = useState(false);
  
  //  1. Estado para el usuario y para forzar recarga de imagen
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });
  const [imgKey, setImgKey] = useState(Date.now());

  // TOMAR CARRITO DEL CONTEXTO
  const { cart } = useCart();
  const cartCount = (cart || []).reduce((acc, item) => acc + item.cantidad, 0);

  // 2.Escuchar cuando alguien hace un "userUpdated"
  useEffect(() => {
    const handleUserUpdate = () => {
      // Releemos el localStorage
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
      // Actualizamos la clave para forzar que la imagen se redibuje
      setImgKey(Date.now());
    };

    // Agregamos el "oído" al evento
    window.addEventListener("userUpdated", handleUserUpdate);

    // Limpieza al sacar foto
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null); 
    setShowMenu(false);
    window.location.href = "/";
  };

  /* Helper para foto */
  const buildUserPhoto = (foto) => {
    if (!foto) return null;
    
    let url = "";
    if (foto.includes("localhost:3000")) {
       const cleanPath = foto.split("3000")[1];
       url = `${import.meta.env.VITE_API_URL}${cleanPath}`;
    } else if (foto.startsWith("http")) {
       url = foto;
    } else {
       const path = foto.startsWith('/') ? foto : `/${foto}`;
       url = `${import.meta.env.VITE_API_URL}${path}`;
    }

    return `${url}?t=${imgKey}`;
  };

  const isLoggedIn = !!user;

  return (
    <header className="w-full flex flex-col z-50 relative">
      
      {/* PARTE SUPERIOR */}
      <div className="w-full py-6 px-4 border-b border-red-100 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">

          {/* ESPACIO VACÍO */}
          <div className="hidden md:flex items-center w-48"></div>

          {/* LOGO */}
          <Link to="/" className="flex items-center gap-2">
            <img src={logoMateUnico} className="h-10 md:h-12 object-contain" />
            <span className="text-2xl md:text-3xl font-serif text-[#8B4513] tracking-wide">
              Mate Unico
            </span>
          </Link>

          {/* ESPACIO DERECHO */}
          <div className="w-48 hidden md:block"></div>
        </div>
      </div>

      {/* PARTE INFERIOR */}
      <div className="w-full bg-[#8B5E3C] text-white">
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">

          {/* LINKS */}
          <nav className="flex items-center gap-6 text-sm tracking-widest font-medium">
            <Link to="/" className="hover:opacity-80">INICIO</Link>
            <Link to="/productos" className="hover:opacity-80">PRODUCTOS</Link>
          </nav>

          {/* ICONOS */}
          <div className="flex items-center gap-4 relative">

            {/* CARRITO CON CONTADOR */}
            <Link to="/carrito" className="relative hover:opacity-80">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full px-2 py-[1px]">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* MENU USUARIO */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1"
              >
                {isLoggedIn && user?.foto ? (
                  <img 
                    src={buildUserPhoto(user.foto)} 
                    className="w-7 h-7 rounded-full object-cover border border-white" 
                    key={imgKey} 
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}

                <svg className={`h-3 w-3 transition-transform ${showMenu ? "rotate-180" : ""}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* DROPDOWN */}
              {showMenu && (
                <div className="absolute right-0 mt-3 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 text-gray-800">
                  {isLoggedIn ? (
                    <div className="flex flex-col">
                      <Link to="/perfil" className="px-4 py-2 hover:bg-gray-100">Tu perfil</Link>
                      <Link to="/historial" className="px-4 py-2 hover:bg-gray-100">Tus compras</Link>
                      <div className="border-t my-1"></div>
                      <button onClick={handleLogout} className="px-4 py-2 text-red-600 hover:bg-gray-100 text-left">Cerrar Sesión</button>
                    </div>
                  ) : (
                    <Link to="/login" onClick={() => setShowMenu(false)} className="px-4 py-3 text-sm hover:bg-gray-50 block">Iniciar Sesión</Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}