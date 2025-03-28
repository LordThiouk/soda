/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  verbose: true,
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.spec.js'
  ],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/'
  ],
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  testTimeout: 30000, // 30 secondes
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: ['__mocks__'],
  globals: {
    NODE_ENV: 'test'
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};

module.exports = config; 