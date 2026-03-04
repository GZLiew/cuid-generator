# Stack Research

**Domain:** Cross-platform desktop utility app (CUID2 generator)
**Researched:** 2026-03-04
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Tauri | 2.10.x | Desktop app shell (Rust backend + webview frontend) | ~5MB binaries vs Electron's 100MB+; ships the OS webview, not a bundled browser; required by project constraints |
| React | 19.2.x | UI framework | Largest ecosystem, best TypeScript support, most Tauri community templates target React; acceptable overhead for a utility app |
| TypeScript | 5.9.x | Type safety across frontend | Catches bugs at compile time; standard in all modern Tauri templates; zero runtime cost |
| Vite | 7.x | Frontend build tool | Officially recommended by Tauri for SPA frontends; fastest HMR; native ESM; Tauri CLI integrates directly with Vite dev server |
| Tailwind CSS | 4.x | Utility-first styling | CSS-first config in v4 (no tailwind.config.js); 5x faster builds; ideal for a small UI with no design system needed |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @paralleldrive/cuid2 | 2.2.2 | Generate CUID2 identifiers | Always — this is the core feature of the app; it's the official maintained implementation by the original CUID2 authors |
| @tauri-apps/plugin-clipboard-manager | 2.3.2 | Write generated CUID2 to system clipboard | Always — required for "copy to clipboard" feature; requires `clipboard-manager:allow-write-text` capability in Tauri config |
| @tauri-apps/api | 2.10.x | Tauri JavaScript bridge (invoke, window, events) | Always — core Tauri frontend API; installed automatically with `create-tauri-app` |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| pnpm | Package manager | Recommended by Tauri docs as the sensible default; faster installs than npm, better monorepo support if needed later |
| tauri-cli (@tauri-apps/cli) | Build, dev, and bundle commands | Use the npm wrapper (`pnpm tauri dev`, `pnpm tauri build`) — avoids global Rust binary conflicts |
| Rust (via rustup) | Compiles Tauri backend | Required; install via `rustup.rs`; Tauri 2 requires Rust stable |
| ESLint + typescript-eslint | Linting | Catches type errors and bad patterns before runtime |

## Installation

```bash
# Scaffold a new Tauri 2 + React + TypeScript project
pnpm create tauri-app@latest cuid-generator --template react-ts

cd cuid-generator

# Core CUID2 library
pnpm add @paralleldrive/cuid2

# Tauri clipboard plugin (JS side)
pnpm add @tauri-apps/plugin-clipboard-manager

# Tailwind CSS v4
pnpm add tailwindcss @tailwindcss/vite

# Add Rust-side clipboard plugin
pnpm tauri add clipboard-manager
```

Tailwind v4 with Vite requires adding the `@tailwindcss/vite` plugin to `vite.config.ts` and a single `@import "tailwindcss"` in your CSS entry — no config file needed.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React 19 | Svelte 5 | If bundle size is critical and you want zero virtual DOM overhead; Svelte compiles away the framework; valid choice for a utility app, but React has better Tauri community support and more examples |
| React 19 | Vanilla JS + TypeScript | If you want absolute minimum JS; for a 2-button UI this is viable, but React adds very little overhead and makes future expansion easier |
| @paralleldrive/cuid2 | @orama/cuid2 (2.2.3) | If @paralleldrive/cuid2 becomes unmaintained; @orama/cuid2 is a compatible fork that's more actively updated as of early 2026 |
| Tailwind CSS v4 | CSS Modules | If you need strict CSS encapsulation; for a single-screen utility app, Tailwind utility classes are faster to write |
| pnpm | npm | If the deployment environment only has npm; functionally equivalent |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Electron | Produces 100MB+ binaries for a utility app that needs zero network access; defeats the purpose of choosing Tauri | Tauri (already chosen) |
| cuid (v1) | Explicitly deprecated; leaks system information (hostname, PID) in generated IDs; security regression | @paralleldrive/cuid2 |
| `navigator.clipboard.writeText()` (browser API) | Requires the webview window to be focused and have user gesture; unreliable in Tauri's webview context and not granted by default | @tauri-apps/plugin-clipboard-manager with explicit `clipboard-manager:allow-write-text` capability |
| Next.js | SSR framework with Node.js server model; incompatible with Tauri's static-file serving model without significant workarounds | Vite + React (SPA, static output) |
| Tauri v1 | EOL; missing mobile targets, plugin ecosystem reorganized, IPC model changed; all community activity moved to v2 | Tauri 2.x |
| uuid / nanoid | Valid alternatives for general IDs, but not CUID2; the project is explicitly a CUID2 generator | @paralleldrive/cuid2 |

## Stack Patterns by Variant

**If keeping the UI absolutely minimal (no framework):**
- Use vanilla TypeScript + Vite (no React)
- The UI is two buttons and a text display — React is not necessary
- However, React adds minimal bundle overhead and makes future features easier to add

**If targeting mobile in future (iOS/Android via Tauri Mobile):**
- Current stack already supports this — Tauri 2 targets mobile
- No stack changes required; add `tauri ios init` / `tauri android init` when needed

**If the app grows to need state management:**
- Add Zustand (lightweight, no boilerplate) — avoid Redux for a utility app
- Current feature set (generate + copy) needs no state library

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| @tauri-apps/api@2.10.x | Tauri CLI 2.10.x | Always keep JS API and CLI in sync; mismatched versions cause IPC errors |
| @tauri-apps/plugin-clipboard-manager@2.3.x | tauri-plugin-clipboard-manager@2.x (Rust) | JS and Rust crate versions must be from the same major series (both v2) |
| React 19 | TypeScript 5.9.x | Compatible; `@types/react` 19.x required alongside |
| Vite 7.x | Node.js 20.19+ or 22.12+ | Vite 7 dropped Node 18; ensure CI/dev machines run Node 20+ |
| Tailwind CSS 4.x | `@tailwindcss/vite` plugin | v4 no longer uses PostCSS by default; use the dedicated Vite plugin, not postcss-based setup |

## Sources

- [Tauri 2.0 Official Site](https://v2.tauri.app/) — Tauri 2 stable confirmed, version 2.10.2 as of Feb 2026 (HIGH confidence)
- [Tauri Create Project Docs](https://v2.tauri.app/start/create-project/) — Official template list and pnpm recommendation (HIGH confidence)
- [Tauri Clipboard Plugin Docs](https://v2.tauri.app/plugin/clipboard/) — API usage and permission model verified (HIGH confidence)
- [@tauri-apps/plugin-clipboard-manager on npm](https://www.npmjs.com/package/@tauri-apps/plugin-clipboard-manager) — v2.3.2, verified current (HIGH confidence)
- [@paralleldrive/cuid2 on npm](https://www.npmjs.com/package/@paralleldrive/cuid2) — v2.2.2, official implementation (HIGH confidence)
- [Vite 7 Release](https://vite.dev/blog/announcing-vite7) — v7.x is current major as of 2025/2026 (HIGH confidence)
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2) — v19.2.4 is current (HIGH confidence)
- [TypeScript 5.9 Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/) — v5.9.x is current (HIGH confidence)
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — v4.x stable since January 2025 (HIGH confidence)

---
*Stack research for: Tauri cross-platform CUID2 generator desktop utility*
*Researched: 2026-03-04*
