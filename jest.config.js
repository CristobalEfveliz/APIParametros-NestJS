/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  testTimeout: 15000,
  setupFiles: ['reflect-metadata'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  moduleNameMapper: {
    '^@andestec/persistencia-redis/nestjs$':
      '<rootDir>/node_modules/@andestec/persistencia-redis/dist/nestjs/index.js',
    '^@andestec/persistencia-redis$':
      '<rootDir>/node_modules/@andestec/persistencia-redis/dist/index.js',
    '^@andestec/api-dispositivos$':
      '<rootDir>/node_modules/@andestec/api-dispositivos/dist/index.js',
  },
};
