/** Tests unitaires : règles métier et adaptateurs, sans base de données. */
module.exports = {
  rootDir: ".",
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  transform: { "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }] },
  // Le client Prisma généré importe ses propres fichiers avec l'extension .js.
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
