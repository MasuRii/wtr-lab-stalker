const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    {
        ignores: ['dist/**', 'build/**', 'node_modules/**'],
    },
    ...tseslint.configs.recommended,
    {
        files: ['src/**/*.ts'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
            globals: {
                document: 'readonly',
                window: 'readonly',
                location: 'readonly',
                console: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                encodeURIComponent: 'readonly',
                MutationObserver: 'readonly',
                URL: 'readonly',
                CustomEvent: 'readonly',
                HTMLElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLFormElement: 'readonly',
                HTMLAnchorElement: 'readonly',
                HTMLButtonElement: 'readonly',
                HTMLStyleElement: 'readonly',
                HTMLLIElement: 'readonly',
                KeyboardEvent: 'readonly',
                Response: 'readonly',
                Request: 'readonly',
                fetch: 'readonly',
            },
        },
        rules: {
            'no-console': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },
);
