import { cpSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineConfig, type Plugin } from "vite";

const dataDir = fileURLToPath(new URL("./data", import.meta.url));

/**
 * `data/` sits outside `public/` on purpose: the layers are hand-maintained
 * source files that get reviewed as diffs, not build assets. They still have
 * to reach `dist/`, so copy them at the end of the build.
 *
 * They are fetched at runtime rather than bundled. Bundling would spend the
 * JS budget on data and turn every record correction into a rebuild of the
 * application.
 *
 * In dev, Vite already serves anything under the project root, so `/data/…`
 * resolves without help.
 */
const copyDataLayers = (): Plugin => ({
  name: "ontario-ai-map:copy-data-layers",
  apply: "build",
  closeBundle() {
    const outDir = fileURLToPath(new URL("./dist/data", import.meta.url));
    if (!existsSync(dataDir)) {
      this.warn("data/ not found — built site will have no layers to load");
      return;
    }
    cpSync(dataDir, outDir, { recursive: true });
  },
});

export default defineConfig({
  plugins: [copyDataLayers()],
  build: {
    target: "es2022",
    // Rollup's limit counts raw bytes, while the budget in CLAUDE.md is 300KB
    // gzipped — different units, so this cannot enforce it. MapLibre alone is
    // ~1.06MB raw, so the threshold sits just above that: the warning stays
    // quiet for the known chunk and fires on anything new and large.
    chunkSizeWarningLimit: 1100,
  },
});
