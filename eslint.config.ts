import eslintPluginAstro from "eslint-plugin-astro"

export default [
  {
    ignores: [".astro/**", "dist/**"],
  },
  ...eslintPluginAstro.configs["flat/recommended"],
  {
    rules: { "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-undef": "off",
    },
  },
]
