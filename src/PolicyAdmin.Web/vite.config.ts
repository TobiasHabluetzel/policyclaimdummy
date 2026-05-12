import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from the root of the Policy Admin service.
export default defineConfig({ plugins: [react()] })
