import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret_for_vitest',
      FRONTEND_URL: 'http://localhost:3000',
    },
  },
})
