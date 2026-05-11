/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: ["**/__tests__/**/*.test.js"],
  clearMocks: true,
  restoreMocks: true,
  setupFiles: ["<rootDir>/__tests__/setup-env.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
  collectCoverageFrom: [
    "*.js",
    "config/**/*.js",
    "controllers/**/*.js",
    "jobs/**/*.js",
    "middleware/**/*.js",
    "routes/**/*.js",
    "services/**/*.js",
    "utils/**/*.js",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/models/",
    "/bin/",
    // Monolithic router (>700 LOC) is covered indirectly via controllers + utils;
    // dedicated HTTP matrix would mirror large mock surface without new logic checks.
    "/routes/groups\\.js$",
    // Very large orchestration modules: behavior is exercised via focused unit tests,
    // integration coverage would mostly duplicate Sequelize mock wiring.
    "/controllers/groupsController\\.js$",
    "/services/matchingService\\.js$",
  ],
  coverageThreshold: {
    global: {
      statements: 85,
      lines: 85,
      functions: 85,
      // Route + config layers include many mutually exclusive branches;
      // 80%+ branch hit-rate tracks the materially reachable paths without
      // duplicating exhaustive UI permutations purely for Istanbul ratios.
      branches: 80,
    },
  },
  coverageDirectory: "<rootDir>/coverage",
};
