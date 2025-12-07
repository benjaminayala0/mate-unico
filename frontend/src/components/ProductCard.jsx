import React from "react";
import { Link } from "react-router-dom";

function Stars({ value }) {
  const rounded = Math.round(value || 0);
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={i <= rounded ? "text-yellow-500" : "text-gray-300"}
      >
        ★
      </span>
    );
  }

  return <span className="text-[13px]">{stars}</span>;
}

export default function ProductCard({ product }) {
  
  const mapColor = (c) => {
    if (!c) return "transparent";
    const color = c.toLowerCase();
    const map = {
      negro: "#000000",
      marron: "#8B4513",
      madera: "#C19A6B",
      verde: "#2E8B57",
      rojo: "#B22222",
      azul: "#1E90FF",
      gris: "#808080",
    };
    return map[color] || color;
  };

  //LÓGICA DE STOCK
  const stock = product.stock || 0;
  const sinStock = stock === 0;

  // Determinar mensaje y color según cantidad
  let stockMsg = null;
  let stockClass = "";

  if (!sinStock) {
      if (stock === 1) {
          stockMsg = "¡Última unidad disponible!";
          stockClass = "text-red-600 font-bold";
      } else if (stock <= 5) {
          stockMsg = "¡Quedan pocas unidades!";
          stockClass = "text-orange-500 font-semibold";
      } else {
          stockMsg = "En stock";
          stockClass = "text-green-600 font-medium";
      }
  }

  return (
    <Link
      to={`/producto/${product.id}`}
      className={`block transition duration-300 h-full ${
        sinStock ? "opacity-60  cursor-default" : "hover:scale-[1.02] cursor-pointer"
      }`}
    >
      <article className="flex flex-col h-full">
        
        {/* IMAGEN */}
        <div className="relative">
          <img
            src={product.imagen}
            alt={product.nombre}
            className="w-full h-[260px] object-cover rounded-md"
          />

          {/* Etiqueta NUEVO (Solo si hay stock) */}
          {product.esNuevo && !sinStock && (
            <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded">
              NUEVO
            </span>
          )}

          {/* Etiqueta SIN STOCK */}
          {sinStock && (
             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm uppercase tracking-wide">
                   Sin Stock
                </span>
             </div>
          )}
        </div>

        {/* TEXTO */}
        <div className="mt-3 space-y-1 flex flex-col flex-1">
          
          <div className="text-[13px] text-gray-900">
            <Stars value={product.rating} />
          </div>

          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
            {product.nombre}
          </h3>

          <div className="mt-auto pt-2">
            <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-gray-900">${product.precio.toLocaleString("es-AR")}</p>
                
                {/* Color */}
                {product.matecolor && (
                    <span
                        className="inline-block w-4 h-4 rounded-full border shadow-sm"
                        style={{ backgroundColor: mapColor(product.matecolor) }}
                        title={`Color: ${product.matecolor}`}
                    ></span>
                )}
            </div>

            {/* STOCK DINÁMICO */}
            {!sinStock && (
                <p className={`text-xs mt-1 ${stockClass}`}>
                    {stockMsg}
                </p>
            )}
            
            {sinStock && (
                <p className="text-xs mt-1 text-red-600 font-bold uppercase">Agotado</p>
            )}
          </div>

        </div>
      </article>
    </Link>
  );
}