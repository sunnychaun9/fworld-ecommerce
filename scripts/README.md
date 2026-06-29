# `scripts/`

Repository automation and developer-experience scripts (database seeding,
codegen, release helpers, environment checks). Keep scripts cross-platform
(Node.js preferred over shell) so they run on macOS, Linux, and Windows.

Conventionally invoked through root `package.json` scripts or directly:

```bash
node scripts/<name>.mjs
```
