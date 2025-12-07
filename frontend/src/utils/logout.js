export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // redirigir al home
  window.location.href = "/";
}
