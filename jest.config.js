module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["dist", "/node_modules"],
  coveragePathIgnorePatterns: ["/generated"],
  globals: {
    Uint8Array: Uint8Array,
    ArrayBuffer: ArrayBuffer
  }
};
