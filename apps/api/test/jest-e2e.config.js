/**
 * Tests de bout en bout : l'application complète contre une vraie base
 * PostgreSQL (DATABASE_URL_TEST), vidée et migrée avant chaque lancement.
 * L'IA y est coupée : aucun appel réseau vers Hugging Face.
 */
module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.e2e-spec.ts"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  // Le client Prisma généré importe ses propres fichiers avec l'extension .js.
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  globalSetup: "<rootDir>/test/global-setup.ts",
  setupFiles: ["<rootDir>/test/test-env.ts"],
  testTimeout: 30000,
};
