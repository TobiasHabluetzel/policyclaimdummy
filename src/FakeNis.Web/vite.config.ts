import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served under /nis/ on the API host. Asset paths need this base prefix.
export default defineConfig({
  plugins: [react()],
  base: '/nis/',
})
