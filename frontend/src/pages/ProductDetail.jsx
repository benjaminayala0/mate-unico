import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

// Cart Context
import { useCart } from "../context/CartContext";
import api from "../api/axios";

/* Componente de estrellas */
function Stars({ value }) {
  const rounded = Math.round(value || 0);
  const stars = [];

  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        className={i <= rounded ? "text-yellow-400" : "text-gray-300"}
      >
        ★
      </span>
    );
  }

  return <span className="text-lg">{stars}</span>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Estados para mensajes globales (Errores)
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");

  //  Estado para el Check Verde de éxito
  const [addedSuccess, setAddedSuccess] = useState(false);

  // CONTEXTO DEL CARRITO
  const { addToCart } = useCart();

  // Cantidad
  const [cantidad, setCantidad] = useState(1);

  // Grabado
  const [grabado, setGrabado] = useState(false);
  const [grabadoTexto, setGrabadoTexto] = useState("");
  const PRECIO_GRABADO = 5000;

  // Color
  const [selectedColor, setSelectedColor] = useState(null);

  // Usuario logueado
  const [currentUser, setCurrentUser] = useState(null);

  // Reseñas
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [canReview, setCanReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  // Form de reseña
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");

  // Función para mensajes globales
  const showMsg = (text, type = "info") => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(""), 3000);
  };

  // Colores dinámicos
  const mapColor = (c) => {
    if (!c) return "transparent";
    const color = c.toLowerCase();
    const map = {
      negro: "#000000",
      marron: "#8B4513",
      madera: "#C19A6B",
      blanco: "#f1f1f1ff",
      rojo: "#B22222",
      azul: "#1E90FF",
      gris: "#808080",
    };
    return map[color] || color;
  };

  /* Construir URL completa de foto */
  const buildUserPhoto = (foto, nombre = "User") => {
    if (!foto) {
      return `https://ui-avatars.com/api/?name=${nombre}&background=random&color=fff&size=128`;
    }
    if (foto.includes("localhost:3000")) {
       const cleanPath = foto.split("3000")[1];
       return `${import.meta.env.VITE_API_URL}${cleanPath}`;
    }
    if (foto.startsWith("http")) return foto;
    const path = foto.startsWith('/') ? foto : `/${foto}`;
    return `${import.meta.env.VITE_API_URL}${path}`;
  };
  
  // Cargar usuario
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  // Cargar producto
  useEffect(() => {
    async function fetchProducto() {
      try {
        const res = await api.get(`/products/${id}`);
        setProducto(res.data);
        if (res.data.matecolor) {
          setSelectedColor(res.data.matecolor);
        }
      } catch (err) {
        console.error("Error cargando producto:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchProducto();
  }, [id]);

  // Cargar reseñas
  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await api.get(`/reviews/product/${id}`);
        setReviews(res.data.reviews || []);
        setAverageRating(res.data.averageRating || 0);
        setTotalReviews(res.data.total || 0);

        if (currentUser) {
          const canRes = await api.get(`/reviews/can/${id}/${currentUser.id}`);
          setCanReview(canRes.data.canReview);
          setUserHasReviewed(canRes.data.alreadyReviewed);
        } else {
          setCanReview(false);
          setUserHasReviewed(false);
        }
      } catch (err) {
        console.error("Error cargando reseñas:", err);
      }
    }
    fetchReviews();
  }, [id, currentUser]);

  useEffect(() => {
    if (producto?.matecolor) {
      setSelectedColor(producto.matecolor);
    }
  }, [producto]);

  // Agregar al carrito
  const handleAddToCart = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        showMsg("Tenés que iniciar sesión para agregar al carrito", "error");
        return;
      }

      if (!selectedColor) {
        showMsg("Seleccioná un color antes de agregar al carrito.", "error");
        return;
      }

      await addToCart({
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        cantidad,
        color: selectedColor || producto.matecolor,
        grabado_texto: grabado ? grabadoTexto : null,
        costo_grabado: grabado ? PRECIO_GRABADO : 0
      });

      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 2000); 
    } catch (err) {
      console.error("Error agregando al carrito:", err);
      showMsg("Hubo un problema al agregar al carrito", "error");
    }
  };
  
  // Enviar reseña
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showMsg("Tenés que iniciar sesión para escribir una reseña.", "error");
      return;
    }

    if (!canReview) {
      showMsg("No podés reseñar este producto. Asegurate de haberlo comprado.", "error");
      return;
    }

    try {
      const body = {
        productId: Number(id),
        rating: Number(ratingInput),
        comentario: commentInput,
        clienteId: currentUser.id,
      };

      await api.post("/reviews", body);

      setCommentInput("");
      setRatingInput(5);

      const res = await api.get(`/reviews/product/${id}`);
      setReviews(res.data.reviews || []);
      setAverageRating(res.data.averageRating || 0);
      setTotalReviews(res.data.total || 0);

      setCanReview(false);
      setUserHasReviewed(true);
      showMsg("Gracias por tu reseña", "success");
    } catch (err) {
      console.error("Error guardando reseña:", err);
      showMsg(err.response?.data?.message || "No se pudo guardar la reseña", "error");
    }
  };

  if (loading)
    return <div className="text-center py-10">Cargando producto...</div>;

  if (error || !producto)
    return (
      <div className="text-center py-10 text-red-600">
        Producto no encontrado o no disponible.
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 relative">
      
      {/* Mensaje Global */}
      {msg && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-8 py-3 rounded shadow-lg text-white font-semibold text-center transition-all duration-300 ${
            msgType === "error" ? "bg-red-600" : "bg-green-600"
        }`}>
          {msg}
        </div>
      )}

      {/* BREADCRUMB */}
      <nav className="text-sm text-gray-600 mb-6 flex items-center gap-2">
        <Link to="/" className="hover:underline">Inicio</Link>
        <span>›</span>
        <Link to="/productos" className="hover:underline">Productos</Link>
        <span>›</span>
        <span className="font-medium text-gray-800">{producto.nombre}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Imagen */}
        <div className="flex justify-center">
          <img
            src={producto.imagen}
            className="w-full max-w-md rounded-lg shadow-lg object-contain h-auto"
            alt={producto.nombre}
          />
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-semibold">{producto.nombre}</h1>

          {/* promedio */}
          <div className="flex items-center gap-3">
            <Stars value={averageRating} />
            <span className="text-lg font-medium">
              {averageRating.toFixed(1)} / 5
            </span>
            <span className="text-sm text-gray-500">
              ({totalReviews} reseña{totalReviews !== 1 ? "s" : ""})
            </span>
          </div>

          <p className="text-3xl font-bold">${producto.precio}</p>

          <p className="text-gray-700">{producto.descripcion}</p>

          {/* Grabado */}
          {producto.permite_grabado ? (
            <>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={grabado}
                  onChange={(e) => setGrabado(e.target.checked)}
                />
                <label className="font-medium">
                  Grabado (opcional) +${PRECIO_GRABADO}
                </label>
              </div>

              <input
                type="text"
                maxLength={20}
                disabled={!grabado}
                className="border px-3 py-2 rounded w-60"
                placeholder="Hasta 20 caracteres"
                value={grabadoTexto}
                onChange={(e) => setGrabadoTexto(e.target.value)}
              />
            </>
          ) : (
            <p className="text-gray-500 italic">
              Este producto no permite grabado
            </p>
          )}

          {/* Colores */}
          <div>
            <p className="font-semibold mb-2">Color</p>
            <div className="flex items-center gap-4">

              <div
                onClick={() => navigate(`/producto/${producto.id}`)}
                className="h-7 w-7 rounded-full border cursor-pointer"
                style={{
                  backgroundColor: mapColor(producto.matecolor),
                  boxShadow:
                    selectedColor === producto.matecolor
                      ? "0 0 0 3px #774d2a"
                      : "none",
                }}
              ></div>

              {producto.relacionados?.map((alt) => (
                <div
                  key={alt.id}
                  onClick={() => navigate(`/producto/${alt.id}`)}
                  className="h-7 w-7 rounded-full border cursor-pointer"
                  style={{ backgroundColor: mapColor(alt.matecolor) }}
                ></div>
              ))}
            </div>

            {/* INDICADOR DE STOCK */}
            {producto.stock === 0 ? (
               <p className="text-red-600 mt-2 font-bold">● Sin stock momentáneamente</p>
            ) : producto.stock === 1 ? (
               <p className="text-red-600 mt-2 font-bold animate-pulse">● ¡Última unidad disponible!</p>
            ) : producto.stock <= 5 ? (
               <p className="text-orange-500 mt-2 font-semibold">● ¡Quedan pocas unidades! ({producto.stock})</p>
            ) : (
               <p className="text-green-600 mt-2 font-medium">● En stock ({producto.stock} disponibles)</p>
            )}
          </div>

          {/* LÓGICA DE CANTIDAD Y BOTÓN */}
          {producto.stock > 0 ? (
            <>
              <div className="flex items-center gap-3 mt-3">
                <button
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                  onClick={() => setCantidad((c) => (c > 1 ? c - 1 : 1))}
                >
                  –
                </button>
                <span className="text-lg font-medium w-8 text-center">{cantidad}</span>
                <button
                  className="px-3 py-1 border rounded hover:bg-gray-100"
                  onClick={() => setCantidad((c) => (c < producto.stock ? c + 1 : c))}
                >
                  +
                </button>
              </div>

              {/* BOTÓN CON CHECK LATERAL */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={handleAddToCart}
                  className="w-full md:w-72 px-6 py-3 bg-[#774d2a] text-white rounded-lg hover:bg-[#5f3c21] transition shadow-md"
                >
                  Agregar al carrito
                </button>

                {/* Ícono de Check animado */}
                {addedSuccess && (
                  <div className="flex items-center justify-center p-2 bg-green-100 rounded-full animate-bounce">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => showMsg("¡Pronto repondremos stock! Te avisaremos.", "info")} 
              className="mt-4 w-full md:w-72 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed hover:bg-gray-500 transition"
            >
              ¿Avísame cuando haya stock?
            </button>
          )}
        </div>
      </div>

      {/* Reseñas */}
      <div className="mt-12 border-t pt-8">
        <h2 className="text-2xl font-semibold mb-4">Reseñas de clientes</h2>

        {/* Formulario */}
        {currentUser ? (
          canReview ? (
            <form
              onSubmit={handleSubmitReview}
              className="mb-8 space-y-3 bg-gray-50 p-4 rounded-lg"
            >
              <div>
                <label className="block font-medium mb-1">
                  Tu calificación
                </label>
                <select
                  value={ratingInput}
                  onChange={(e) => setRatingInput(e.target.value)}
                  className="border rounded px-3 py-2"
                >
                  {[5, 4, 3, 2, 1].map((v) => (
                    <option key={v} value={v}>
                      {v} estrellas
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Comentario</label>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  maxLength={300}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Contanos qué te pareció el producto"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-[#774d2a] text-white rounded-lg hover:bg-[#5f3c21]">
                Enviar reseña
              </button>
            </form>
          ) : (
            <p className="mb-8 text-gray-600 text-sm">
              {userHasReviewed
                ? "Ya escribiste una reseña para este producto."
                : "Solo podés reseñar productos que hayas comprado."}
            </p>
          )
        ) : (
          <p className="mb-8 text-gray-600 text-sm">
            Iniciá sesión para escribir una reseña. Las reseñas son visibles para todos los usuarios.
          </p>
        )}

        {/* Listado */}
        <div className="space-y-4">
          {reviews.length === 0 && (
            <p className="text-gray-500 text-sm">
              Todavía no hay reseñas para este producto.
            </p>
          )}

          {reviews.map((r) => (
            <div
              key={r.id}
              className="border rounded-lg p-4 flex gap-3 items-start"
            >
              <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                <img
                  src={buildUserPhoto(r.foto,`${r.nombre}+${r.apellido}`)}
                  alt={r.nombre}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">
                    {r.nombre} {r.apellido}
                  </p>
                  <Stars value={r.calificacion} />
                </div>

                <p className="text-gray-700 mt-1 text-sm">
                  {r.comentario}
                </p>

                {r.fecha && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.fecha).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}