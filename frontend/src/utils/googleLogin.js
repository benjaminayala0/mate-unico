import axios from "axios";

export async function signInWithGoogle(response) {
  try {
    const tokenGoogle = response.credential;

    // Enviar el token de Google al backend
    const res = await axios.post("http://localhost:3000/api/auth/google", {
      tokenGoogle,
    });

    // Guardar token del backend
    localStorage.setItem("token", res.data.token);

    // Guardar usuario
    localStorage.setItem("user", JSON.stringify(res.data.user));

    // Guardar carrito
    if (res.data.carrito) {
      localStorage.setItem("carrito", JSON.stringify(res.data.carrito));
    }

    // Redirigir al perfil
    window.location.href = "/perfil";

  } catch (err) {
    console.error("Error login Google:", err);
    alert("Error iniciando sesión con Google");
  }
}
