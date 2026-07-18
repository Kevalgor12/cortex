import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';

// Focused config: it only enforces the import-ordering convention.
//   1. third-party packages
//   2. type-only imports (from anywhere)
//   3. utils — src/lib/*
//   4. everything else local (components, hooks, styles — .scss stays last)
// Groups are separated by a blank line and sorted case-insensitively.
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'import-x': importX,
    },
    rules: {
      // Split `import { x, type Y }` so type-only names land in the Types group.
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
      ],
      'import-x/order': [
        'error',
        {
          groups: [['builtin', 'external'], 'type', 'internal', ['parent', 'sibling', 'index']],
          // Put lib/ helpers in their own "utils" group. `**` can't cross `..`
          // in minimatch, so list the relative depths we actually use.
          pathGroups: [
            { pattern: '{.,..,../..,../../..}/lib/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['type'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
);
