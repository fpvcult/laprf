module.exports = {
  roots: ["<rootDir>/src"],
  transform: { "^.+\\.tsx?$": "ts-jest" },
  moduleFileExtensions: ["ts", "js"],
  testMatch: ["**/*.test.(ts|js)"],
  testEnvironment: "node"
};
