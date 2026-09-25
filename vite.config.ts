import babel from "@rolldown/plugin-babel";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Relative base so the build works under a GitHub Pages project path.
export default defineConfig({ base: "./", plugins: [react(), babel({ presets: [reactCompilerPreset()] })] });
