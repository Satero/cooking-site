import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Tests run in a US timezone on purpose: a UTC-offset zone is what exposes the
// `new Date("YYYY-MM-DD")` off-by-one-day bug that src/data/dates.ts guards against.
process.env.TZ = 'America/Detroit'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
