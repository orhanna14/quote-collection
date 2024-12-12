import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import dotenv from 'dotenv';

dotenv.config(); // Load env files

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  }
});