module.exports = {
  preset: 'ts-jest',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  moduleFileExtensions: ['ts', 'js'],
  testMatch: ['**/*.test.(ts|js)'],
  testEnvironment: 'node',
};
