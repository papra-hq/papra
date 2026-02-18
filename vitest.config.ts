import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    isolate: false,
    reporters: ['verbose'],
    projects: ['apps/*', 'packages/*'],
    coverage: {
      include: ['packages/*/src'],
    },
    env: {
      TZ: 'UTC',
    },
  },
})