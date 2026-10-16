import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    // Keep generated code minified; review and format its TypeScript source instead.
    ignorePatterns: ["com.openai/hooks/refusal.mjs"],
    sortImports: true,
  },
  lint: {
    categories: {
      correctness: "error",
      perf: "error",
      style: "error",
      suspicious: "error",
    },
    ignorePatterns: ["com.openai/hooks/refusal.mjs"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    options: { typeAware: true, typeCheck: true },
    overrides: [
      {
        files: ["tests/**/*.ts"],
        // Protocol tests need fixture setup/cleanup and literal exit codes, e.g. status 1.
        rules: { "max-statements": "off", "no-magic-numbers": "off" },
      },
    ],
    plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "node", "promise", "vitest"],
    rules: {
      // This package runs short-lived Node hooks, e.g. synchronous stdin and fixture reads.
      "import/no-nodejs-modules": "off",
      "node/no-sync": "off",
      "one-var": ["error", "never"],
      // Oxfmt owns import order so the formatter and linter agree.
      "sort-imports": "off",
      "vite-plus/prefer-vite-plus-imports": "error",
      // Tests import their APIs explicitly, e.g. expect from vite-plus/test.
      "vitest/no-importing-vitest-globals": "off",
    },
  },
  pack: {
    // Preserve the hand-written hooks.json beside the generated bundle.
    clean: false,
    dts: false,
    entry: { refusal: "src/index.ts" },
    format: "esm",
    inputOptions: { moduleTypes: { ".md": "text" } },
    minify: true,
    outDir: "com.openai/hooks",
    outExtensions: () => ({ js: ".mjs" }),
    platform: "node",
    target: "node22",
  },
});
