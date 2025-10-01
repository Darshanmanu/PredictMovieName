import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Configure the development server to run on all interfaces.  This is useful
  // when running inside a container.  You can change the port if needed.
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});