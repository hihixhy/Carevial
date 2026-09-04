import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import skipFormatting from 'eslint-config-prettier/flat'
import pluginPrettier from 'eslint-plugin-prettier'

export default defineConfig([
  {
    name: 'backend/files-to-lint',
    files: ['**/*.{js,mjs,cjs}']
  },

  globalIgnores(['**/node_modules/**']),

  {
    name: 'backend/language-options',
    languageOptions: {
      globals: {
        ...globals.node
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  },

  js.configs.recommended,

  {
    name: 'backend/prettier-rules',
    plugins: {
      prettier: pluginPrettier
    },
    rules: {
      'prettier/prettier': 'warn',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },

  skipFormatting
])
