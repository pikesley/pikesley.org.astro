module.exports = {
  parser: "@babel/eslint-parser",
  extends: ["eslint:recommended", "plugin:astro/recommended"],
  overrides: [
    {
      // Define the configuration for `.astro` file.
      files: ["*.astro"],
      // Allows Astro components to be parsed.
      parser: "astro-eslint-parser",
      // Parse the script in `.astro` as TypeScript by adding the following configuration.
      // It's the setting you need when using TypeScript.
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
      rules: {
        // "astro/no-set-text-directive": "error",
        // "astro/no-unused-css-selector": "error",
        // "astro/prefer-class-list-directive": "error",
        // "astro/prefer-object-class-list": "error",
        // "astro/prefer-split-class-list": "error",
        // "astro/jsx-a11y/alt-text": "error",
        // "astro/jsx-a11y/anchor-has-content": "error",
        // "astro/jsx-a11y/anchor-is-valid": "error",
        // "astro/jsx-a11y/aria-activedescendant-has-tabindex": "error",
        // "astro/jsx-a11y/aria-props": "error",
        // "astro/jsx-a11y/aria-proptypes": "error",
      },
    },
    // ...
  ],
};
