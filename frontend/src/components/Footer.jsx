import React from "react";

export default function Footer() {
  return (
    <footer className="bg-[#8B5E3C] text-white w-full py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
        
        {/* IZQUIERDA: CONTACTO */}
        <div className="flex items-center gap-3">
          {/* Icono Teléfono */}
          <div className="bg-black/10 p-2 rounded-full">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-black" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-200 font-light uppercase tracking-wider">Contacto</span>
            <span className="font-semibold text-sm md:text-base">+54 11 4321-5678</span>
          </div>
        </div>

        {/* CENTRO: COPYRIGHT */}
        <div className="text-center">
          <p className="text-sm font-medium opacity-90">
            Todos los derechos reservados ®
          </p>
        </div>

        {/* DERECHA: REDES SOCIALES */}
        <a 
          href="https://instagram.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* Icono Instagram */}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="text-black"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          <span className="text-white font-semibold text-sm md:text-base">@MateUnico</span>
        </a>
      </div>
    </footer>
  );
}