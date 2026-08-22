import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Design2 snapshot build configuration.
 *
 * The `src/` folder inside this directory is intentionally a single thin file
 * (`./src/Design2App.tsx`) that re-exports the current root `App` component.
 * This keeps design2 an exact, byte-for-byte mirror of the deployed prototype
 * without duplicating thousands of lines of code that would drift over time.
 *
 * If you want a fully standalone design2 (no alias to the root), copy the
 * contents of `../src/` into `./src/` and remove the `resolve.alias` block.
 */
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      // Re-use the root prototype sources so design2 stays in lock-step.
      "@root-src": path.resolve(__dirname, "..", "src"),
    },
  },
});
