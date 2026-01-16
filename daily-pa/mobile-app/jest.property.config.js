// Separate Jest config for property tests that don't need React Native
module.exports = {
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.property.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ]
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  // Don't transform fast-check
  transformIgnorePatterns: [
    'node_modules/(?!(fast-check)/)'
  ],
};
