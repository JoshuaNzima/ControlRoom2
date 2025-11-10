module.exports = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/resources/js/$1'
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/public/'
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/js/jest.setup.js']
};