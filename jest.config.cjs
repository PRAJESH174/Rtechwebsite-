module.exports = {
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'server.js',
    'api/**/*.js',
    'database/**/*.js',
    'cache/**/*.js',
    'services/**/*.js',
    'security/**/*.js',
    'monitoring/**/*.js',
    'middleware/**/*.js',
    'utils/**/*.js',
    '!**/node_modules/**',
    '!**/config/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '**/tests/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 10000,
  verbose: true,
  bail: false,
  maxWorkers: 4,
  transform: {},
  testPathIgnorePatterns: ['/node_modules/'],
  moduleNameMapper: {}
};
