module.exports = {
  // Specifies the environment in which the code is expected to run
  env: {
    // Disables browser-specific global variables like `window`
    browser: false,
    // Enables ES6 (ECMAScript 2015) globals and features
    es6: true,
    // Enables Jest testing framework globals
    jest: true,
  },

  // Extends base ESLint configurations and plugins
  extends: [
    // Extends Airbnb's base JavaScript style guide
    'airbnb-base',
    // Enables rules for Jest (a JavaScript testing framework)
    'plugin:jest/all',
  ],

  // Defines global variables and their settings
  globals: {
    // These global variables are readonly and won't be considered errors if used
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },

  // Specifies the parser options, including ECMAScript version and module type
  parserOptions: {
    // ECMAScript version 2018 (includes async/await and other ES2018 features)
    ecmaVersion: 2018,
    // Specifies the code should be interpreted as using ECMAScript modules (import/export)
    sourceType: 'module',
  },

  // List of plugins used for additional linting rules
  plugins: ['jest'],

  // Custom rules to modify or disable certain ESLint behavior
  rules: {
    // Disables the rule that limits the number of classes in a file
    'max-classes-per-file': 'off',

    // Disables the rule against using underscores in variable names (e.g., `_variable`)
    'no-underscore-dangle': 'off',

    // Disables the rule that warns about the use of `console` (i.e., console.log, etc.)
    'no-console': 'off',

    // Disables the rule against variable shadowing (declaring a variable with the same name in an inner scope)
    'no-shadow': 'off',

    // Restrict certain syntax; in this case, disallow labeled statements and `with` statements
    'no-restricted-syntax': [
      'error',
      'LabeledStatement', // Prevents using labeled loops
      'WithStatement',    // Prevents using the `with` statement (deemed confusing and error-prone)
    ],
  },

  // Overriding configurations for specific files or patterns
  overrides: [
    {
      // Applies to all JavaScript files
      files: ['*.js'],
      // Excludes specific file (babel config file here)
      excludedFiles: 'babel.config.js',
    },
  ],
};

