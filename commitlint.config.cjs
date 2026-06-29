/**
 * Commitlint configuration — enforces Conventional Commits.
 * https://www.conventionalcommits.org/
 *
 * Format: <type>(<scope>): <subject>
 * Example: feat(cart): add quantity stepper to mini-cart
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // a new feature
        'fix', // a bug fix
        'docs', // documentation only
        'style', // formatting, no code change
        'refactor', // code change that neither fixes a bug nor adds a feature
        'perf', // performance improvement
        'test', // adding or fixing tests
        'build', // build system or dependencies
        'ci', // CI configuration
        'chore', // other changes that don't modify src or test
        'revert', // reverts a previous commit
      ],
    ],
    // Scopes are free-form per the Engineering Handbook (Part 2 — Commit
    // Standards), which uses domain scopes such as (auth), (cart), (api).
    // Scope is optional but, when present, must be kebab-case to match the
    // handbook's naming conventions.
    'scope-empty': [0],
    'scope-case': [2, 'always', 'kebab-case'],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case', 'start-case']],
    'header-max-length': [2, 'always', 100],
  },
};
