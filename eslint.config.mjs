import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  // Extend Next.js ESLint config
  ...compat.extends("next/core-web-vitals"),
  
  // Base configurations
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // Main configuration for all TypeScript/JavaScript files
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // React rules
      "react/react-in-jsx-scope": "off", // Not needed in Next.js
      "react/prop-types": "off", // Using TypeScript for prop validation
      
      // React Hooks rules
      ...pluginReactHooks.configs.recommended.rules,
      
      // Accessibility rules (selective for better development experience)
      "jsx-a11y/alt-text": "warn",
      "jsx-a11y/aria-props": "warn",
      "jsx-a11y/aria-proptypes": "warn",
      "jsx-a11y/aria-unsupported-elements": "warn",
      "jsx-a11y/role-has-required-aria-props": "warn",
      "jsx-a11y/role-supports-aria-props": "warn",
      
      // TypeScript rules (configured for better development experience)
      "@typescript-eslint/no-unused-vars": ["warn", { 
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_" 
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // General JavaScript rules
      "prefer-const": "warn",
      "no-empty": "warn",
      "no-console": ["warn", { allow: ["warn", "error", "info"] }], // Allow info for debugging
      "no-debugger": "warn",
      
      // XState specific rules (custom for our stack)
      "no-restricted-imports": ["warn", {
        patterns: [{
          group: ["xstate/lib/*"],
          message: "Please use top-level XState imports instead of internal lib imports."
        }]
      }],
    },
  },
  
  // Configuration for server components and actions
  {
    files: [
      "src/app/**/page.{js,ts,jsx,tsx}",
      "src/app/**/layout.{js,ts,jsx,tsx}",
      "src/app/**/loading.{js,ts,jsx,tsx}",
      "src/app/**/error.{js,ts,jsx,tsx}",
      "src/app/**/not-found.{js,ts,jsx,tsx}",
      "src/actions/**/*.{js,ts}",
    ],
    rules: {
      // Server components specific rules
      "react-hooks/rules-of-hooks": "off", // Server components don't use hooks
      "no-console": "off", // Allow console logs in server actions for debugging
    },
  },
  
  // Configuration for AI/Genkit flows (more lenient for external integrations)
  {
    files: ["src/ai/**/*.{js,ts}"],
    rules: {
      // More lenient rules for AI integration code
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off", // Allow console logs in AI flows for debugging
    },
  },
  
  // Configuration for XState machine definitions
  {
    files: ["src/lib/xstate/**/*.{js,ts}"],
    rules: {
      // XState machines often use complex object configurations
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "warn",
    },
  },
  
  // Configuration for data adapters (external API integrations)
  {
    files: ["src/services/**/*.{js,ts}"],
    rules: {
      // External API integrations often require any types
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "off", // Sometimes necessary for API responses
    },
  },
  
  // Files and directories to ignore
  {
    ignores: [
      // Build outputs
      "**/node_modules/**",
      "**/.next/**", 
      "**/dist/**",
      "**/build/**",
      
      // Configuration files
      "**/*.config.{js,mjs,cjs,ts}",
      "**/.*rc.{js,mjs,cjs,ts}",
      
      // Data files
      "**/*.json",
      "src/ai/definitions/**/*.json",
      "tsconfig.json",
      "package.json",
      "package-lock.json",
      
      // Generated files
      ".next/",
      "out/",
      "coverage/",
      
      // Development files
      "**/*.test.{js,ts,jsx,tsx}",
      "**/*.spec.{js,ts,jsx,tsx}",
      "**/test/**/*",
      "**/tests/**/*",
    ],
  },
];