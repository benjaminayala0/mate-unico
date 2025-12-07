export function initGoogleLogin(onSuccess) {
  /* Espera a que Google cargue */
  window.onload = () => {
    google.accounts.id.initialize({
      client_id: "",
      callback: onSuccess,
    });
  };
}
