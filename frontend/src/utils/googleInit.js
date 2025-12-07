import { signInWithGoogle } from "./googleLogin";

export function initGoogle() {
  if (!window.google) {
    console.error("Google Identity Services no está cargado");
    return;
  }

  window.google.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: signInWithGoogle,
  });
}

export function renderGoogleButton() {
  if (!window.google) return;

  window.google.accounts.id.renderButton(
    document.getElementById("googleBtn"), 
    {
      theme: "outline",
      size: "large",
      width: 300,
    }
  );
}
