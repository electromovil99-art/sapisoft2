import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 1. ESTA ES LA LÍNEA QUE ARREGLA LA PÁGINA EN BLANCO
      base: '/sapisoft2/', 

      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      
      // 2. CORRECCIÓN DE SEGURIDAD (Limpiamos process.env)
      define: {
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // Eliminamos 'process.env': env para no exponer toda tu PC
      }
    };
});
