import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glsl from 'vite-plugin-glsl';

/**
 * `base: './'` mantiene las rutas relativas para que el build funcione
 * tal cual en GitHub Pages (o en cualquier subdirectorio estático).
 */
export default defineConfig({
  base: './',
  plugins: [
    react(),
    // Permite `#include` entre archivos .glsl para componer los shaders.
    glsl({ include: ['**/*.glsl', '**/*.vert', '**/*.frag'] }),
  ],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
  },
});
