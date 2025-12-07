import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Cuenta() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Timestamp para forzar la recarga de la imagen
  const [imgKey, setImgKey] = useState(Date.now());

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    setUser(JSON.parse(stored));
  }, [navigate]);

  /* FUNCIÓN HELPER PARA LA FOTO */
  const buildUserPhoto = (foto) => {
    if (!foto) {
       const nombreCompleto = user ? `${user.nombre}+${user.apellido}` : "User";
       return `https://ui-avatars.com/api/?name=${nombreCompleto}&background=random&color=fff&size=128`;
    }

    let urlFinal = "";

    // Parche de seguridad (Localhost a Ngrok)
    if (foto.includes("localhost:3000")) {
       const cleanPath = foto.split("3000")[1];
       urlFinal = `${import.meta.env.VITE_API_URL}${cleanPath}`;
    }
    // Si ya es URL externa
    else if (foto.startsWith("http")) {
       urlFinal = foto;
    }
    // Ruta relativa
    else {
       const path = foto.startsWith('/') ? foto : `/${foto}`;
       urlFinal = `${import.meta.env.VITE_API_URL}${path}`;
    }

    // pegamos el timestamp al final
    // Esto hace que el navegador crea que es una URL nueva y la baje de nuevo
    return `${urlFinal}?t=${imgKey}`;
  };

  // SUBIR FOTO
  const handleUploadFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("foto", file);

    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${user.id}/foto`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Error al subir imagen");

      const data = await res.json();

      if (data.foto) {
        const updated = { ...user, foto: data.foto };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        
        // ACTUALIZA EL TIMESTAMP AL SUBIR
        // Al cambiar esto, la función buildUserPhoto devolverá una URL nueva
        setImgKey(Date.now()); 
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (error) {
      console.error("Error subiendo foto:", error);
      alert("No se pudo subir la foto. Intenta de nuevo.");
    }
  };

  const handleClickEliminar = () => {
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/usuarios/${user.id}/foto`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error("Error al eliminar imagen");

      const data = await res.json();

      if (data.ok) {
        const updated = { ...user, foto: null };
        localStorage.setItem("user", JSON.stringify(updated));
        setUser(updated);
        setImgKey(Date.now());
        window.dispatchEvent(new Event("userUpdated"));
      }
    } catch (error) {
      console.error("Error eliminando foto:", error);
      alert("No se pudo eliminar la foto.");
    } finally {
      setShowDeleteModal(false);
    }
  };

  if (!user) {
    return <div className="p-10 text-center">Cargando...</div>;
  }

  return (
    <div className="w-full flex flex-col items-center py-10 relative">
      <h1 className="text-4xl font-bold mb-10">Mi Cuenta</h1>

      <div className="flex w-full max-w-2xl gap-10">

        {/* MENÚ LATERAL */}
        <div className="w-48 bg-gray-100 rounded-xl shadow-sm p-4 flex flex-col items-center text-center h-fit">

          <img
            src={buildUserPhoto(user.foto)}
            alt="Foto de perfil"
            className="w-20 h-20 rounded-full object-cover border"
            //  fuerza a React a redibujar la imagen sí o sí
            key={imgKey} 
          />

          <button
            onClick={() => document.getElementById("fotoInput").click()}
            className="text-xs text-blue-600 underline mt-2 hover:text-blue-800"
          >
            Cambiar foto
          </button>

          {user.foto && (
            <button
              onClick={handleClickEliminar} 
              className="text-xs text-red-600 underline mt-1 hover:text-red-800"
            >
              Quitar foto
            </button>
          )}

          <input
            id="fotoInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadFoto}
          />

          <h2 className="text-lg font-semibold mt-3 break-words w-full">
            {user.nombre} {user.apellido}
          </h2>

          <div className="w-full h-px bg-gray-300 my-3"></div>

          <div className="w-full flex flex-col items-start text-left text-sm">
            <Link to="/perfil" className="py-1 hover:underline font-medium text-gray-800">Cuenta</Link>
            <Link to="/historial" className="py-1 hover:underline text-gray-600">Historia de Compras</Link>
          </div>
        </div>

        {/* CARD PRINCIPAL */}
        <div className="flex-1 w-full">
          <div className="bg-white border rounded-xl shadow-sm p-8">

            <div className="w-full flex items-center mb-8 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-900">
                {user.nombre} {user.apellido}
              </h3>

              <button
                onClick={() => navigate("/completar-perfil")}
                className="ml-auto text-gray-500 hover:text-[#774d2a] font-medium flex items-center gap-2 transition"
              >
                ✏️Editar Datos
              </button>
            </div>

            <div className="mt-4 text-sm text-gray-700 leading-relaxed">
              <p><strong>Género:</strong> {user.genero || "No cargado"}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p>
                <strong>Datos:</strong> {user.domicilio}, {user.ciudad}, {user.provincia}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL PERSONALIZADO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all scale-100">
            
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar foto de perfil?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer. Tu foto se borrará permanentemente.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md font-medium transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminacion}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}