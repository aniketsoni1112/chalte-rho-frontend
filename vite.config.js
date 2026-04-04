// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
//   plugins: [react(), tailwindcss()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      'unconsummately-merocrine-tashia.ngrok-free.dev', // Aapka ngrok link
      '.ngrok-free.app' // Saare ngrok links ko allow karne ke liye wildcard
    ]
  }
})