import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    sortImports: true,
  },
  lint: {
    categories: {
      correctness: "error",
      perf: "error",
      style: "error",
      suspicious: "error",
    },
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    options: { typeAware: true, typeCheck: true },
    plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "node", "promise", "vitest"],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
  },
});
