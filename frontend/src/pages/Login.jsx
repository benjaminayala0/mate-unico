import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import loginimage from "../assets/login/fondo-login.jpeg";
import { signInWithGoogle } from "../utils/googleLogin";
import axios from "axios";

export default function Login() {
  const handleGoogleResponse = async (response) => {
    const tokenGoogle = response.credential;

    try {
      const res = await axios.post("http://localhost:3000/api/auth/google", {
        tokenGoogle,
      });

      console.log("Respuesta backend:", res.data);

      
      const user = res.data.user;

      // Guardar token y usuario
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      
      const faltaCompletar =
        !user.genero ||
        !user.provincia ||
        !user.ciudad ||
        !user.domicilio ||
        !user.codigo_postal;
        !user.fecha_nacimiento;

      if (faltaCompletar) {
        console.log("Faltan completar datos del perfil, redirigiendo...");
        window.location.href = "/completar-perfil";
      } else {
        console.log("Redirigiendo a mi perfil");
        window.location.href = "/perfil";
      }

    } catch (err) {
      console.error("Error backend:", err.response?.data || err);
    }
  };

  useEffect(() => {
    function startGoogle() {
      if (!window.google) {
        console.error("Google Identity no cargó todavía");
        return;
      }

      console.log("Google cargó correctamente, inicializando…");

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById("googleBtn"),
        {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          width: 320,
        }
      );
    }

    if (window.google) {
      startGoogle();
    } else {
      window.addEventListener("load", startGoogle);
    }

    return () => {
      window.removeEventListener("load", startGoogle);
    };
  }, []);

  return (
    <div className="relative w-full flex items-center justify-center py-20">
      
      {/* Fondo */}
      <div className="absolute inset-0">
        <img 
          src={loginimage}
          alt="Fondo Mates"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
      </div>

      {/* Card */}
      <div className="relative z-10 bg-white w-full max-w-md mx-4 rounded-xl shadow-2xl p-8 flex flex-col items-center text-center">

        <Link to="/" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>

        <div className="mb-4 text-3xl">🔑</div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Accedé a tu cuenta
        </h2>

        {/* BOTÓN DE GOOGLE */}
        <div id="googleBtn" className="mb-6"></div>

        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Iniciá sesión o registrate en un clic usando tu cuenta de Google
        </p>

      </div>
    </div>
  );
}
