/** @type {import('dependency-cruiser').IConfiguration} */
const signerModules = [
  "^viem/accounts",
  "^ethers($|/)",
  "^@ethersproject/(wallet|signing-key|hdnode)",
  "^@solana/web3\\.js",
  "^@solana/keys",
  "^@solana/signers",
  "^tweetnacl",
  "^bip39$",
  "^@scure/bip(32|39)",
  "^ed25519-hd-key",
  "^@noble/(curves|secp256k1|ed25519)",
];

const testFiles = "\\.(test|live\\.test)\\.ts$";

module.exports = {
  forbidden: [
    {
      name: "no-signers",
      severity: "error",
      comment:
        "Nero is read-only. Signing, key derivation and seed libraries are banned everywhere (ADR 0004).",
      from: {},
      to: { path: signerModules },
    },
    {
      name: "no-unresolvable",
      severity: "error",
      comment: "Every import must resolve; undeclared workspace or npm dependencies are not allowed.",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "core-no-node",
      severity: "error",
      comment: "core must stay portable (browser / MetaMask Snap): no Node built-ins.",
      from: { path: "^packages/core/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "core-no-workspace",
      severity: "error",
      comment: "core imports nothing from other workspace packages.",
      from: { path: "^packages/core/" },
      to: { path: "^(packages/(providers|runtime)|apps)/" },
    },
    {
      name: "core-npm-allowlist",
      severity: "error",
      comment: "core may only depend on zod at runtime. Test files may use vitest.",
      from: { path: "^packages/core/", pathNot: testFiles },
      to: {
        dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer", "npm-no-pkg", "npm-unknown"],
        pathNot: "node_modules/zod/",
      },
    },
    {
      name: "providers-only-core-ports-shared",
      severity: "error",
      comment: "providers may only use core/ports and core/shared.",
      from: { path: "^packages/providers/" },
      to: { path: "^packages/core/src/", pathNot: "^packages/core/src/(ports|shared)/" },
    },
    {
      name: "providers-no-upward",
      severity: "error",
      from: { path: "^packages/providers/" },
      to: { path: "^(packages/runtime|apps)/" },
    },
    {
      name: "runtime-no-cli",
      severity: "error",
      from: { path: "^packages/runtime/" },
      to: { path: "^apps/" },
    },
    {
      name: "cli-no-providers",
      severity: "error",
      comment: "The CLI talks to runtime only; it never reaches into providers.",
      from: { path: "^apps/cli/" },
      to: { path: "^packages/providers/" },
    },
    {
      name: "cli-core-types-only",
      severity: "error",
      comment: "The CLI may import types from core (events, verdicts) but no runtime values.",
      from: { path: "^apps/cli/" },
      to: { path: "^packages/core/", dependencyTypesNot: ["type-only"] },
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)\\.[^/]+\\.(js|cjs|mjs|ts|json)$",
          "\\.d\\.ts$",
          "(^|/)tsconfig\\.json$",
          "\\.config\\.(js|cjs|mjs|ts)$",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "(^|/)dist/" },
    tsPreCompilationDeps: true,
    combinedDependencies: true,
    tsConfig: { fileName: "tsconfig.base.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["@nero-agent/source", "import", "types", "default"],
      mainFields: ["module", "main", "types"],
      extensions: [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"],
    },
  },
};
