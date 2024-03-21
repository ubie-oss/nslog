module.exports = {
  env: {
    node: true,
  },
  ignorePatterns: ["dist/"],
  parserOptions: {
    ecmaVersion: "es2021",
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint/eslint-plugin", "import", "unused-imports"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  rules: {
    "object-shorthand": "error",
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-console": ["error"],
    "no-process-env": "error",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/consistent-type-assertions": [
      "error",
      {
        assertionStyle: "never",
      },
    ],
    "unused-imports/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrors: "all",
      },
    ],
    "unused-imports/no-unused-imports": "error",
    "import/no-default-export": "error",
    "import/no-anonymous-default-export": "error",
    "import/no-duplicates": "error",
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling"],
          "index",
          "object",
          "type",
        ],
        alphabetize: { order: "asc", caseInsensitive: true },
        "newlines-between": "never",
        pathGroupsExcludedImportTypes: ["builtin"],
      },
    ],
  },
  overrides: [
    {
      files: ["**/*.test.ts"],
      rules: {
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "no-control-regex": "off",
      },
    },
  ],
};
