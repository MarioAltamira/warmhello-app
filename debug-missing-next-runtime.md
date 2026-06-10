# Debug Session: missing-next-runtime [OPEN]

## Symptom
- `npm.cmd run dev` does not produce a working preview because `next`, `@next/swc-win32-x64-msvc`, and `eslint` binaries are missing from `node_modules`.

## Scope
- Project: `stillgood-app`
- Goal: restore a stable install so the Next app can start on `http://localhost:8080`

## Hypotheses
- H1. `npm install` is being interrupted before `reify` completes, leaving `node_modules` half-written.
- H2. A local security tool is removing or quarantining specific installed files after npm writes them.
- H3. The install is resolving from the wrong working directory or package root at some stage.
- H4. The project lacks a lockfile and npm is repeatedly rebuilding the tree in a way that fails on this machine.
- H5. Optional native packages such as `@next/swc-win32-x64-msvc` are being skipped or pruned during install.

## Evidence Log
- `npm.cmd install` exited without producing a complete `node_modules` tree.
- Root packages such as `next`, `typescript`, and `eslint` were missing or incomplete even though temp `reify` folders existed.
- `node_modules/.next-sW1XUegR` contained a usable `next` package payload.
- `node_modules/.typescript-Bgs2TZTM` contained a usable `typescript` package payload.
- A generated temp shim existed at `node_modules/.bin/.next.cmd-Hd66Bled`.
- The scoped SWC package could be recovered by downloading and extracting the tarball for `@next/swc-win32-x64-msvc@16.2.7`.
- The app reached `Ready` on `http://localhost:8080` after promoting temp packages and copying missing dependencies into place.
- `npm.cmd run lint` still reports missing eslint dependency packages, so the npm install is not fully normalized yet even though runtime works.

## Actions
- Promoted the recovered `next` package from `node_modules/.next-sW1XUegR/package` into `node_modules/next`.
- Promoted the recovered `typescript` package from `node_modules/.typescript-Bgs2TZTM` into `node_modules/typescript`.
- Restored command shims in `node_modules/.bin` for `next`, `tsc`, `tsserver`, and `eslint`.
- Downloaded and extracted `eslint@9.39.4` and `@next/swc-win32-x64-msvc@16.2.7` tarballs into `node_modules`.
- Promoted additional top-level temp packages with valid `package.json` files, including `baseline-browser-mapping` and `caniuse-lite`.
- Verified `npm.cmd run dev` starts Next.js 16.2.7 on `http://localhost:8080`.
