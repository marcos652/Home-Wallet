import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Home Wallet — Gestão financeira",
    short_name: "Home Wallet",
    description: "Gestão financeira pessoal, simples e organizada.",
    start_url: "/",
    // Abre sem a barra do navegador, como um app instalado.
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#4338ca",
    lang: "pt-BR",
    icons: [
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
      { src: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
  };
}
