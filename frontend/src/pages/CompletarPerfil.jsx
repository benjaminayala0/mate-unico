import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CompletarPerfil() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    genero: "",
    fecha_nacimiento: "",
    provincia: "",
    ciudad: "",
    domicilio: "",
    codigo_postal: "",
  });

  // Cargar datos básicos desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      // si no hay usuario logueado volvemos al login
      navigate("/login");
      return;
    }

    const u = JSON.parse(stored);
    setUser(u);

    setForm({
      nombre: u.nombre || "",
      apellido: u.apellido || "",
      genero: u.genero || "",
      fecha_nacimiento: u.fecha_nacimiento
        ? u.fecha_nacimiento.slice(0, 10)
        : "",
      provincia: u.provincia || "",
      ciudad: u.ciudad || "",
      domicilio: u.domicilio || "",
      codigo_postal: u.codigo_postal || "",
    });
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    // si cancela, lo mandamos a "Mi Cuenta"
    navigate("/perfil"); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await axios.put(
        `http://localhost:3000/api/usuarios/${user.id}`,
        form,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const actualizado = res.data.usuario || res.data.user || res.data;

      // actualizar usuario en localStorage
      localStorage.setItem("user", JSON.stringify(actualizado));

      // ir a la vista "Mi Cuenta"
      navigate("/perfil");
    } catch (err) {
      console.error(err);
      setError("No se pudieron guardar los cambios. Intentalo de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full flex justify-center py-12">
      <div className="w-full max-w-3xl px-4">
        <h1 className="text-2xl font-semibold text-center mb-8">
          Detalles de la cuenta
        </h1>

        {error && (
          <p className="mb-4 text-sm text-red-600 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* NOMBRE */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              NOMBRE *
            </label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Nombre"
              required
            />
          </div>

          {/* APELLIDO */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              APELLIDO *
            </label>
            <input
              type="text"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Apellido"
              required
            />
          </div>

          {/* GENERO */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              GENERO *
            </label>
            <select
              name="genero"
              value={form.genero}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              required
            >
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
              <option value="prefiero_no_decirlo">
                Prefiero no decirlo
              </option>
            </select>
          </div>

          {/* FECHA DE NACIMIENTO */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              FECHA DE NACIMIENTO
            </label>
            <input
              type="date"
              name="fecha_nacimiento"
              value={form.fecha_nacimiento}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
            />
          </div>

          {/* PROVINCIA */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              PROVINCIA
            </label>
            <input
              type="text"
              name="provincia"
              value={form.provincia}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Provincia"
            />
          </div>

          {/* CIUDAD */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              CIUDAD/LOCALIDAD
            </label>
            <input
              type="text"
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Ciudad"
            />
          </div>

          {/* DOMICILIO */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              DOMICILIO
            </label>
            <input
              type="text"
              name="domicilio"
              value={form.domicilio}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Domicilio"
            />
          </div>

          {/* CODIGO POSTAL */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              CÓDIGO POSTAL
            </label>
            <input
              type="text"
              name="codigo_postal"
              value={form.codigo_postal}
              onChange={handleChange}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder="Código postal"
            />
          </div>

          {/* BOTONES */}
          <div className="flex justify-center gap-4 pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 rounded-md bg-[#99663a] text-white text-sm"
            >
              Cancelar Cambios
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-md bg-[#99663a] text-white text-sm disabled:opacity-60"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
