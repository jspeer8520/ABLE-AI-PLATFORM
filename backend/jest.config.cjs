/**
 * Jest configuration for the ABLE backend.
 *
 * ts-jest compiles TypeScript on the fly. The module system is overridden to
 * CommonJS for the test runtime (the build itself targets NodeNext) which keeps
 * Jest's module resolution simple and stable.
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  // @able/db exposes only an "import" export condition; map it to source so
  // Jest's CommonJS resolver can load it (ts-jest transforms the .ts).
  moduleNameMapper: {
    '^@able/db$': '<rootDir>/../packages/db/lib/client.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/app.ts',
    '!src/types/**/*',
  ],
  // Enforce a coverage floor so regressions in test coverage fail CI. These
  // thresholds sit just below the current measured levels (statements/lines
  // ~79%, functions ~67%, branches ~53%) with a small safety margin, so they
  // pass today while preventing backsliding. Assumes the integration suite runs
  // against the docker-compose Postgres + Redis.
  coverageThreshold: {
    global: {
      statements: 70,
      lines: 70,
      functions: 60,
      branches: 50,
    },
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          verbatimModuleSyntax: false,
          esModuleInterop: true,
        },
      },
    ],
  },
};
