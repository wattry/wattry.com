# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Package manager: **pnpm** (`pnpm install`). `@wattry/promises` comes from GitHub Packages (`npm.pkg.github.com`, scope `@wattry`); CI authenticates with `GITHUB_TOKEN`, local installs need a GitHub Packages token in `~/.npmrc`.

- `pnpm dev` — Vite dev server on port 3000 (`pnpm start` is the same with `PORT=3000`); env loaded from repo-root `.env`
- `pnpm build` — production build to repo-root `dist/` (`prebuild` wipes legacy `docs/` and `build/`)
- `pnpm tc` — `tsc --noEmit` type-check (strict config)
- `pnpm cf:dev` / `pnpm cf:deploy` — run / deploy the API Cloudflare Worker in `workers/` (`npx wrangler *` is pre-allowed)
- `pnpm site:deploy` — build and deploy the static site Worker (`wrangler.site.jsonc`)

No lint script, no unit tests. `playwright.config.ts` exists but no spec files are tracked.

## Deployment

- **Site:** assets-only Cloudflare Worker `wattry-com` (`wrangler.site.jsonc`, SPA fallback) serving `dist/` at `wattry.com` + `www.wattry.com`. `.github/workflows/deploy.yml` deploys both Workers on push to `main` via `cloudflare/wrangler-action` (`CLOUDFLARE_API_TOKEN` secret). Build needs `VITE_CF_ENDPOINT` (repo var) and `POSTHOG_API_KEY` / `POSTHOG_PROJECT_ID` / `POSTHOG_HOST` (secrets) for the PostHog sourcemap plugin in `vite.config.ts`; locally these come from repo-root `.env` and `pnpm site:deploy` does the same build + deploy.
- **API:** Cloudflare Worker `wattry-api-com` (`workers/src/worker.js`) served at `api.wattry.com` (`wrangler.jsonc`, account `47e3faccce876684f7fe752fe5e04d31`). Bindings: D1 `DB` (schema in `workers/schema.sql`, `scores` table) and a `ratelimits` binding `SCORE_RATE_LIMITER` (1 req / 60 s per IP). Routes: `GET /typetest/board`, `POST /typetest/score`. CORS allows `https://wattry.com`, or `http://localhost:3000` when `env.LOCAL` is set. `SNIPPET_IDS` in the worker must stay in sync with `src/static/snippets.ts`. See `AGENTS.md` for Cloudflare doc-retrieval rules.

## Architecture

Single-page React 19 + MUI v9 site (personal portfolio presented as an interactive terminal, plus LinkedIn OAuth demo). TypeScript with very strict `tsconfig` (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`, …). `ImportMetaEnv` for `VITE_*` vars is declared in `types/env.d.ts`.

**Vite quirks (`vite.config.ts`):**
- `root: 'src'` — `index.html` lives in `src/`, not repo root; `publicDir` is repo-root `public/`
- `envDir: '..'` — env vars read from repo-root `.env`; client-exposed vars must be prefixed `VITE_*`
- Path alias `@/*` → `src/*`
- Rolldown `codeSplitting` groups `react` and `mui` vendor chunks

**Composition (`src/main.tsx` → `src/App.tsx`):**
```
PostHogProvider → AuthProvider → NotificationProvider → ThemeProvider(theme) → CssBaseline
  Background, Header, Notification, Main, TerminalContextProvider(Terminal), Footer
```

**Terminal (`src/components/Layout/Terminal.tsx`, `react-terminal`) is the site.** Everything a visitor sees comes from its `commands` record. Each entry is a `Command`: `handler(args)` returns a `ReactElement` (sync or async), `help` is an element or factory, and optional `text()` returns plain lines so the command can be piped through `| grep <pattern>` (only one pipe stage supported). The `defaultHandler` at the bottom splits on `|`, handles `help`/`-h`/`--help`, and gates every command except `su`, `help`, `h`, `man` until the visitor runs `su <user>` (user persisted via IndexedDB). To add content, add a command there.

Toy commands each live in their own component under `components/Layout/` (`Snake`, `MatrixRain`, `SlTrain`, `Lomu`, `TopMonitor`, `TypeTest`, `Leaderboard`, `ImpossibleQuizModal`). Full-screen/keyboard toys use `hooks/useCaptureKeydown.ts`, a capture-phase document listener that swallows keys (except modifier combos) so the terminal input doesn't see them. Components must survive StrictMode double-mount (see git history for `sl`/`lomu` fixes). `TypeTest` + `Leaderboard` talk to the Worker via `VITE_CF_ENDPOINT`.

Static assets (`static/space.mp4`, `static/work-gantt.svg`) are ES-imported; module declarations live in `src/react-app-env.d.ts`.

**Providers (`src/providers/`):**
- `AuthProvider` — LinkedIn 3-stage OAuth (redirect → code → token). Reads `VITE_LINKEDIN_*`, `VITE_REDIRECT_URL`, `VITE_API`, etc.
- `idb.ts` — IndexedDB wrapper (`idb` package) used in place of `localStorage` for user data.
- `NotificationProvider` — global snackbar context consumed by `Layout/Notification.tsx`.

**Styling:** MUI v9 `styled()` API, co-located per component (no `makeStyles`/`tss-react`). Theme is `src/styles/theme.ts` (single dark theme).

## Repo conventions

- **No tests / no verification steps.** The user explicitly rejects test code and verification (`npx tsc`, `pnpm dev` smoke, Playwright runs) inside plans and implementations for this repo. Edit → commit. Do not add a vitest/jest setup or write new spec files unless asked.
- Commit messages: conventional prefixes (`feat:`, `fix:`, `chore:`, `revert:`), lowercase, no attribution trailer (`.claude/settings.local.json` blanks it).
- `plans/` and `specs/` hold dated implementation plans and design specs (`YYYY-MM-DD-<topic>.md`); both are gitignored except files already tracked. `src/work/` holds personal Mermaid/markdown work artifacts (dated, never overwritten).
- The `/checking` skill (`.claude/skills/checking/`) generates the anonymized work Gantt: `.mmd` in `src/work/` plus rendered `src/static/work-gantt.svg` consumed by the terminal `work` command.
