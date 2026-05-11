const js = require("@eslint/js");
const globals = require("globals");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  {
    ignores: [".eslintrc.js", "**/coverage/**", "jest.config.cjs"],
  },
  {
    ...js.configs.recommended,
    files: ["**/__tests__/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: { ecmaVersion: "latest", sourceType: "commonjs" },
    },
    rules: {
      ...js.configs.recommended.rules,
      "require-await": "error",
      "no-use-before-define": [
        "error",
        { functions: false, classes: true, variables: true },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "object-curly-spacing": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      indent: "off",
    },
  },
  {
    ...js.configs.recommended,
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { ecmaVersion: "latest", sourceType: "commonjs" },
    },
    rules: {
      "require-await": "error",
      "eol-last": ["error", "always"],
      "no-use-before-define": [
        "error",
        { functions: false, classes: true, variables: true },
      ],
      "no-var": "error",
      "prefer-const": "error",
      "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      "object-curly-spacing": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
      indent: "off",
    },
  },
  prettierConfig,
];
