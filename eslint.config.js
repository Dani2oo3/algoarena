import tseslint from 'typescript-eslint';

const browserGlobals = {
  document: 'readonly',
  window: 'readonly',
  performance: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  HTMLElement: 'readonly',
  PointerEvent: 'readonly',
  KeyboardEvent: 'readonly',
  Math: 'readonly',
  Date: 'readonly',
  Set: 'readonly',
  Map: 'readonly',
  Array: 'readonly',
  Number: 'readonly',
  String: 'readonly',
  Boolean: 'readonly',
  Object: 'readonly',
  Error: 'readonly',
  console: 'readonly',
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts'],
    languageOptions: { globals: browserGlobals },
  },
);
