/**
 * Lance les tests e2e. Le client Prisma 7 charge son moteur par un import()
 * dynamique, que Jest n'autorise qu'avec l'option --experimental-vm-modules.
 */
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const jest = path.join(path.dirname(require.resolve("jest/package.json")), "bin", "jest.js");
const result = spawnSync(
  process.execPath,
  ["--experimental-vm-modules", "--no-warnings=ExperimentalWarning", jest, "--config", "test/jest-e2e.config.js", "--runInBand", ...process.argv.slice(2)],
  { stdio: "inherit", cwd: path.join(__dirname, "..") },
);
process.exit(result.status ?? 1);
