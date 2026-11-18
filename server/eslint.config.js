import js from '@eslint/js';
import globals from 'globals';

// Revisión de calidad del backend: detecta variables sin definir, imports que faltan, etc.
export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: globals.node },
    rules: { 'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }] },
  },
];
