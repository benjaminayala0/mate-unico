import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom"; 
import ProductCard from "../components/ProductCard";
import axios from "axios";

export default function Products() {
  const [productos, setProductos] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL params
  const location = useLocation();
  const navigate = useNavigate(); 
  const params = new URLSearchParams(location.search);

  // Params de URL
  const searchMode = params.get("search"); 
  const comboMode = params.get("combo") === "true";
  const newMode = params.get("new") === "true";

  // Estado local para el input (Lo que escribe el usuario)
  const [localSearch, setLocalSearch] = useState(searchMode || "");

  // Estados de filtros (Checkboxes)
  const [combo1, setCombo1] = useState(false);
  const [combo2, setCombo2] = useState(false);

  const [tipoMate, setTipoMate] = useState({
    Torpedo: false,
    Camionero: false,
    Imperial: false,
  });

  const [material, setMaterial] = useState({
    Calabaza: false,
    Metal: false,
    Madera: false,
    Vidrio: false,
  });

  // 1. CARGAR PRODUCTOS 
  useEffect(() => {
    async function cargarProductos() {
      try {
        const res = await axios.get("http://localhost:3000/api/products");

        const items = await Promise.all(
          res.data.map(async (item) => {
            let avg = 0;
            try {
              const r = await axios.get(`http://localhost:3000/api/reviews/product/${item.id}`);
              avg = r.data.averageRating ?? 0;
            } catch {}

            return {
              id: item.id,
              nombre: item.nombre,
              precio: Number(item.precio),
              esNuevo: item.esnew,
              imagen: item.imagen,
              rating: avg,
              tipocombo: item.tipocombo,
              material: item.material,
              stock: item.stock,
            };
          })
        );

        // Orden inicial
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        setProductos(items);
        setFiltrados(items);
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    }
    cargarProductos();
  }, []);

  // 2. FILTROS INICIALES (Desde URL)
  useEffect(() => {
    if (comboMode) { setCombo1(true); setCombo2(true); }
  }, [comboMode]);

  useEffect(() => {
    if (newMode && productos.length > 0) {
      aplicarFiltroNuevos();
    }
  }, [newMode, productos]);

  // Sincronizar el input local con la URL si cambia externamente
  useEffect(() => {
    setLocalSearch(searchMode || "");
  }, [searchMode]);

  // 3. APLICAR TODOS LOS FILTROS
  useEffect(() => {
    aplicarTodosLosFiltros();
  }, [combo1, combo2, tipoMate, material, productos, searchMode]); // Agregamos searchMode

  const aplicarTodosLosFiltros = () => {
    let res = [...productos];

    /* FILTRO BUSQUEDA (Desde la URL) */
    if (searchMode) {
      res = res.filter((p) => 
        p.nombre.toLowerCase().includes(searchMode.toLowerCase())
      );
    }

    /* FILTRO COMBOS */
    if (combo1 || combo2) {
      const combosSeleccionados = [];
      if (combo1) combosSeleccionados.push("Mate + Bombilla");
      if (combo2) combosSeleccionados.push("Mate + Bombilla + Portatermo");
      res = res.filter((p) => combosSeleccionados.includes(p.tipocombo));
    }

    /* FILTRO TIPO DE MATE */
    const tiposActivos = Object.keys(tipoMate).filter((t) => tipoMate[t]);
    if (tiposActivos.length > 0) {
      res = res.filter((p) =>
        tiposActivos.some((t) => p.nombre.toLowerCase().includes(t.toLowerCase()))
      );
    }

    /* FILTRO MATERIAL */
    const materialesActivos = Object.keys(material).filter((m) => material[m]);
    if (materialesActivos.length > 0) {
      res = res.filter((p) =>
        materialesActivos.includes(p.material?.charAt(0).toUpperCase() + p.material?.slice(1).toLowerCase())
      );
    }

    setFiltrados(res);
  };

  // FUNCIONES AUXILIARES
  const aplicarFiltroNuevos = () => {
    const nuevos = productos.filter((p) => p.esNuevo === true);
    setFiltrados(nuevos);
  };

  // Manejar búsqueda al presionar Enter
  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
        // Actualizamos la URL con el término de búsqueda
        navigate(`/productos?search=${encodeURIComponent(localSearch)}`);
    }
  };

  const ordenarProductos = (modo) => {
    let ordenados = [...filtrados];
    switch (modo) {
      case "destacados": ordenados.sort((a, b) => (b.rating || 0) - (a.rating || 0)); break;
      case "precio-mayor": ordenados.sort((a, b) => a.precio - b.precio); break;
      case "precio-menor": ordenados.sort((a, b) => b.precio - a.precio); break;
      case "nuevo-primero": ordenados.sort((a, b) => (b.esNuevo === true) - (a.esNuevo === true)); break;
      case "viejo-primero": ordenados.sort((a, b) => (a.esNuevo === true) - (b.esNuevo === true)); break;
      default: ordenados = [...productos];
    }
    setFiltrados(ordenados);
  };

  const limpiarFiltros = () => {
    setCombo1(false); setCombo2(false);
    setTipoMate({ Torpedo: false, Camionero: false, Imperial: false });
    setMaterial({ Calabaza: false, Metal: false, Madera: false, Vidrio: false });
    setLocalSearch(""); 
    navigate("/productos"); 
  };

  // RENDER
  return (
    <div className="w-full min-h-screen bg-white px-8 py-8">
      
      {/* Migas de Pan */}
      <nav className="text-sm text-gray-600 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:underline">Inicio</Link>
        <span>›</span>

        <button
        onClick={limpiarFiltros}
        className="text-gray-800 font-medium hover:underline focus:outline-none"
        >
          Productos
        </button>

        {searchMode && <span className="text-[#8B4513] font-medium"> › Buscando: "{searchMode}"</span>}
      </nav>

      <div className="flex gap-10">
        
        {/* SIDEBAR (Filtros) */}
        <aside className="w-52 flex-shrink-0 text-gray-900">
          <h3 className="font-semibold mb-2">Tipo de Mate</h3>
          <ul className="space-y-2 mb-6">
            {Object.keys(tipoMate).map((t) => (
              <li key={t}>
                <input type="checkbox" checked={tipoMate[t]} onChange={() => setTipoMate({ ...tipoMate, [t]: !tipoMate[t] })} />
                <span className="ml-2">{t}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mb-2">Material</h3>
          <ul className="space-y-2 mb-6">
            {Object.keys(material).map((m) => (
              <li key={m}>
                <input type="checkbox" checked={material[m]} onChange={() => setMaterial({ ...material, [m]: !material[m] })} />
                <span className="ml-2">{m}</span>
              </li>
            ))}
          </ul>
          <h3 className="font-semibold mb-2">Combos</h3>
          <ul className="space-y-2">
            <li>
              <input type="checkbox" checked={combo1} onChange={() => setCombo1(!combo1)} />
              <span className="ml-2">Mate + Bombilla</span>
            </li>
            <li>
              <input type="checkbox" checked={combo2} onChange={() => setCombo2(!combo2)} />
              <span className="ml-2">Mate + Bombilla + Portamate</span>
            </li>
          </ul>
        </aside>

        {/* LISTADO (CONTENIDO) */}
        <section className="flex-1 flex flex-col min-h-[600px]">
          
          {/* HEADER DE PRODUCTOS: Buscador + Ordenar */}
          <div className="flex flex-col items-end gap-3 mb-6">
            
            {/* Nuevo Buscador en Página */}
            <div className="relative w-full sm:w-48">
                <input 
                    type="text" 
                    placeholder="Buscar mate..." 
                    className="border border-gray-300 rounded px-3 py-1 pl-8 text-sm w-56 focus:outline-none w-full sm:w-48"
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    onKeyDown={handleSearchSubmit}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>

            {/* Select Ordenar */}
            <select
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none w-full sm:w-48"
              onChange={(e) => ordenarProductos(e.target.value)}
              defaultValue="destacados"
            >
              <option value="destacados">Destacados</option>
              <option value="precio-menor">Precio mayor a menor</option>
              <option value="precio-mayor">Precio menor a mayor</option>
              <option value="nuevo-primero">Más nuevo a más viejo</option>
              <option value="viejo-primero">Más viejo a más nuevo</option>
            </select>
          </div>

          {/* GRID DE PRODUCTOS */}
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <p>Cargando productos...</p>
            </div>
          ) : filtrados.length > 0 ? (
            <div className="grid grid-cols-3 gap-10 mt-4">
              {filtrados.map((prod) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          ) : (
            // EMPTY STATE (Sin resultados)
            <div className="flex flex-1 items-center justify-center mt-4">
               <div className="w-full max-w-md flex flex-col items-center py-12 text-center bg-gray-50 rounded-lg border border-gray-100">
                  <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No encontramos productos</h3>
                  <p className="text-gray-500 mb-6">Intenta cambiando los filtros o buscando otra categoría.</p>
                  <button onClick={limpiarFiltros} className="px-6 py-2 bg-[#8B4513] text-white rounded hover:bg-[#6F370F] transition-colors shadow-sm">
                     Limpiar filtros
                  </button>
               </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}