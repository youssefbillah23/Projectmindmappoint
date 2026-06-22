import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// On GitHub Pages the site is served from /<repo>/, so we set the base path
// only for that build (the workflow sets GITHUB_PAGES=true). For the githack
// preview branch we use relative "./" so assets resolve from index.html's
// folder. Everywhere else — local dev and Vercel — it stays at the root "/".
const base = process.env.RELATIVE_BASE
  ? "./"
  : process.env.GITHUB_PAGES
    ? "/Projectmindmappoint/"
    : "/";

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
