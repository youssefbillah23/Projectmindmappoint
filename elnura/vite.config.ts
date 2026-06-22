import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// On GitHub Pages the site is served from /<repo>/, so we set the base path
// only for that build (the workflow sets GITHUB_PAGES=true). Everywhere else
// — local dev and Vercel — it stays at the root "/".
const base = process.env.GITHUB_PAGES ? "/Projectmindmappoint/" : "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
