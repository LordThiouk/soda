/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  moduleNameMapper: {
    // Mockez les importations de fichiers CSS
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    // Alias pour les chemins absolus
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // Utilisez babel-jest pour transformer les fichiers JS/TS/TSX
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  // Niveaux de couverture de code à atteindre
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Rapports de couverture de code
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/_*.{js,jsx,ts,tsx}',
    '!src/**/index.{js,jsx,ts,tsx}',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  // Configuration pour les tests d'intégration
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.spec.{js,jsx,ts,tsx}',
  ],
};

module.exports = config; 