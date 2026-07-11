import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.d.ts',
  ],
};

export default config;
