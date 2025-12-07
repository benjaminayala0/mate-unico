import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import heroImg from "../assets/home/hero-mates.jpeg";
import hero1Img from "../assets/home/hero-mates1.jpeg";
import hero2Img from "../assets/home/hero-mates2.jpeg";
import combosImg from "../assets/home/combos.jpeg";
import productosImg from "../assets/home/productos.jpeg";
import newsletterBg from "../assets/home/newsletter-bg.jpeg";
import iconTruck from "../assets/home/icon-truck.png";
import iconLock from "../assets/home/icon-lock.png";
import iconSupport from "../assets/home/support.png";

// COMPONENTE DE ESTRELLAS

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

export default function Home() {

  const navigate = useNavigate();

  // SLIDER 
  const slides = [
    { url: heroImg, title: "Set de mates" },
    { url: hero1Img, title: "Set de mates 1" },
    { url: hero2Img, title: "Set de mates 2" },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    setCurrentIndex(isFirstSlide ? slides.length - 1 : currentIndex - 1);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    setCurrentIndex(isLastSlide ? 0 : currentIndex + 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const [newProducts, setNewProducts] = useState([]);

  useEffect(() => {
    async function loadNewProducts() {
      try {
        //  VITE_API_URL en lugar de localhost fijo
        const res = await fetch(`http://localhost:3000/api/products`);
        const data = await res.json();

        // 1. Filtramos primero los que son "Nuevos"
        const candidatos = data.filter((p) => p.esnew === true).slice(0, 3);

        // 2. Buscamos el rating real de cada uno
        const itemsConRating = await Promise.all(
          candidatos.map(async (item) => {
            let avg = 0;
            try {
              const r = await fetch(`http://localhost:3000/api/reviews/product/${item.id}`);
              const rData = await r.json();
              avg = rData.averageRating || 0;
            } catch {}

            return {
              id: item.id,
              nombre: item.nombre,
              precio: item.precio,
              esNuevo: item.esnew,
              imagen: item.imagen,
              rating: avg, 
              tipocombo: item.tipocombo,
            };
          })
        );

        setNewProducts(itemsConRating);

      } catch (error) {
        console.error("Error cargando productos:", error);
      }
    }

    loadNewProducts();
  }, []);


  // FEATURES 
  const features = [
    {
      id: 1,
      icon: iconTruck,
      title: "Envio Gratis",
      description: "A partir de $150.000",
    },
    {
      id: 2,
      icon: iconLock,
      title: "Compra Protegida",
      description: "Seguro by Mercado Pago",
    },
    {
      id: 3,
      icon: iconSupport,
      title: "24/7 Soporte",
      description: "Solo por número de teléfono",
    },
  ];

  return (
    <div className="bg-white">

      {/* SLIDER */}
      <section className="max-w-6xl mx-auto px-4 pt-10 relative group">

        <div
          className="w-full h-[500px] md:h-[500px] lg:h-[600px] rounded-md  bg-cover duration-500"
          style={{ backgroundImage: `url(${slides[currentIndex].url})` }}
        ></div>

        {/* FLECHA IZQUIERDA */}
        <div
          className="absolute top-[50%] left-8 text-2xl rounded-full p-2 bg-white/80 hover:bg-white cursor-pointer shadow-md hidden group-hover:block"
          onClick={prevSlide}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-black">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </div>

        {/* FLECHA DERECHA */}
        <div
          className="absolute top-[50%] right-8 text-2xl rounded-full p-2 bg-white/80 hover:bg-white cursor-pointer shadow-md hidden group-hover:block"
          onClick={nextSlide}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-black">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        {/* PUNTITOS */}
        <div className="flex justify-center py-2 mt-2 gap-2">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`cursor-pointer rounded-full ${
                currentIndex === idx
                  ? "bg-[#8B5E3C] w-8 h-2"
                  : "bg-gray-300 w-2 h-2"
              }`}
            ></div>
          ))}
        </div>
      </section>

      {/* TITULAR */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-[2fr,1fr] gap-10">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-black">
          Simple Unico/
          <br />
          Simple Mejor.
        </h1>
        <p className="text-black text-base md:text-lg self-center">
          Mate Único es una tienda online argentina especializada en mates artesanales y accesorios.
        </p>
      </section>

      {/* COMBOS + PRODUCTOS */}
      <section className="max-w-6xl mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* COMBOS */}
        <div>
          <h2 className="text-black text-2xl font-semibold">Combos</h2>
          <button
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
            onClick={() => navigate("/productos?combo=true")}
          >
            Compra Ahora →
          </button>
          <img src={combosImg} className="w-full h-[280px] md:h-[320px] object-cover rounded-md mt-4" />
        </div>

        {/* PRODUCTOS */}
        <div>
          <h2 className="text-black text-2xl font-semibold">Productos</h2>
          <button
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
            onClick={() => navigate("/productos")}
          >
            Compra Ahora →
          </button>
          <img src={productosImg} className="w-full h-[280px] md:h-[320px] object-cover rounded-md mt-4" />
        </div>

      </section>

      {/* RECIÉN LLEGADOS */}
      <section className="max-w-6xl mx-auto px-4 pb-16">

        <div className="flex items-end justify-between mb-6">
          <h2 className="text-black text-3xl font-semibold leading-tight">
            Recién<br />Llegados
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {newProducts.map((product) => (
            <article
              key={product.id}
              className="flex flex-col cursor-pointer"
              onClick={() => navigate(`/producto/${product.id}`)}
            >
              <div className="relative">
                <img
                  src={product.imagen}
                  className="w-full h-[260px] object-cover rounded-md"
                />

                {/* BADGE NUEVO */}
                {product.esNuevo === true && (
                  <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded">
                    NUEVO
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-1">
                {/* Rating Dinámico */}
                <div className="flex items-center gap-2">
                   <Stars value={product.rating} />
                   <span className="text-xs text-gray-500">({product.rating?.toFixed(1) || 0})</span>
                </div>

                <h3 className="text-sm font-semibold text-gray-900">{product.nombre}</h3>
                <p className="text-sm text-gray-800">${product.precio}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feat) => (
            <article key={feat.id} className="bg-[#f3f5f6] rounded-md px-8 py-10">
              <img src={feat.icon} alt={feat.title} className="h-10 w-10 mb-2" />
              <h3 className="text-lg font-semibold">{feat.title}</h3>
              <p className="text-sm text-gray-500">{feat.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="w-full">
        <div className="relative max-w-6xl mx-auto px-4 pb-20">
          <div className="rounded-md overflow-hidden h-[260px] md:h-[300px] lg:h-[320px] relative">
            <img src={newsletterBg} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40"></div>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <h2 className="text-2xl md:text-3xl text-white mb-3">
                Suscríbete a nuestro boletín informativo
              </h2>
              <p className="text-sm md:text-base text-gray-100 mb-5 max-w-xl">
                Regístrate para recibir ofertas, nuevos productos y promociones.
              </p>

              <form className="flex flex-col md:flex-row gap-3 w-full max-w-md">
                <input
                  type="email"
                  placeholder="Email"
                  className="flex-1 px-4 py-2 rounded-md border bg-white/90"
                />
                <button className="px-6 py-2 rounded-md bg-black text-white">
                  Inscribirse
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}