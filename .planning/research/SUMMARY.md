# Project Research Summary

**Project:** CUID Generator
**Domain:** Cross-platform desktop utility app (CUID2 generation)
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

This is a small, single-purpose developer utility desktop app — a category with well-established patterns. The expert approach is to prioritise absolute minimal friction: generate a CUID2, have it automatically land in the clipboard, confirm visually, and get out of the way. The Raycast CUID extension is the closest analogue and validates the "one click, ID is already in clipboard before you look for it" interaction model. The closest gap this app fills is delivering that same zero-friction experience on both macOS and Windows, without requiring Raycast or any other dependency.

The recommended stack is Tauri 2 + React 19 + TypeScript 5.9 + Vite 7 + Tailwind CSS 4. This is a well-supported, officially-documented combination with appropriate defaults for a utility this size. The core CUID2 generation runs in the Rust backend via the `cuid2` crate, exposed to the frontend through a single Tauri IPC command. Clipboard access is handled by the official `tauri-plugin-clipboard-manager`, gated behind an explicit `clipboard-manager:allow-write-text` capability grant. The entire frontend state is a single `string | null` variable — no state management library needed.

The primary risks are infrastructure, not feature complexity. Tauri cannot cross-compile: macOS and Windows binaries must be built on their respective platforms via CI matrix (GitHub Actions). macOS distribution requires Apple code signing and notarization or Gatekeeper will hard-block the app entirely. These are not features to add later — they must be configured before any distribution occurs, even for testing. The feature set itself is straightforward to implement; the distribution and signing pipeline is where teams consistently get blocked late.

## Key Findings

### Recommended Stack

Tauri 2 is the correct choice for this utility: ~5MB binaries vs Electron's 100MB+, uses the OS WebView, and supports both macOS and Windows in v2. The frontend is React 19 with TypeScript and Vite 7 (officially recommended by Tauri), styled with Tailwind CSS v4. CUID2 generation uses the `@paralleldrive/cuid2` npm package (official implementation) on the JS side, with the `cuid2` Rust crate available for backend generation if preferred. The clipboard plugin (`@tauri-apps/plugin-clipboard-manager`) is the only supported path for reliable clipboard writes in Tauri's WebView context — the browser `navigator.clipboard` API is unreliable without user-gesture focus.

**Core technologies:**
- Tauri 2.10.x: Desktop shell — ~5MB binary, OS WebView, required by project constraints
- React 19.2.x: UI framework — largest ecosystem, best TypeScript support, most Tauri templates target React
- TypeScript 5.9.x: Type safety — catches bugs at compile time, zero runtime cost
- Vite 7.x: Build tool — officially recommended by Tauri, fastest HMR, integrates directly with Tauri CLI
- Tailwind CSS 4.x: Styling — CSS-first config, 5x faster builds, ideal for a small UI with no design system
- @paralleldrive/cuid2 2.2.2: CUID2 generation — official maintained implementation
- @tauri-apps/plugin-clipboard-manager 2.3.2: Clipboard access — only reliable clipboard path in Tauri WebView

**Do not use:** Electron (100MB+), cuid v1 (deprecated, leaks system info), `navigator.clipboard.writeText()` (unreliable in Tauri), Next.js (SSR incompatible with Tauri), Tauri v1 (EOL).

### Expected Features

The feature scope is intentionally narrow. The table-stakes MVP is five things: generate, display, auto-copy, visual confirmation, and offline operation. Every anti-feature (history, bulk generation, format options, settings UI, multi-format support) has been explicitly evaluated and rejected — scope creep is the biggest risk to the app's core value proposition of "one click, done."

**Must have (table stakes):**
- Generate CUID2 on demand — core purpose; single button trigger
- Display generated ID prominently — monospace font, large, immediately visible
- Auto-copy to clipboard on generate — collapses generate + copy into one action; no second click
- Visual copy confirmation — brief "Copied!" state on button (~1.5s); removes uncertainty
- Offline operation (Windows + macOS) — hard requirement; no network calls at any point

**Should have (competitive, post-launch):**
- Keyboard shortcut to generate — developer-native interaction; add when users report reaching for keyboard
- Always-on-top window mode — reduces context switching; add with minimal footprint improvements
- System tray integration — silent generate + copy without switching focus; depends on auto-copy working

**Defer (v2+):**
- Configurable CUID2 length — only if users explain why the default 24-char output doesn't work for them
- Multi-format ID support (UUID, NanoID, ULID) — scope explosion risk; out of scope entirely for v1

### Architecture Approach

The architecture is a standard two-process Tauri app. The Rust core handles CUID2 generation via a `#[tauri::command]` that calls `cuid2::create_id()`, returning a plain string over IPC to the frontend. The frontend holds a single reactive `string | null` state variable, renders the ID, and calls `writeText()` from the clipboard plugin for copy operations. There is no routing, no state management library, and no external services — the app is fully offline. The key security requirement is Tauri v2's deny-by-default capability model: `clipboard-manager:allow-write-text` must be explicitly declared in `capabilities/default.json` or the copy button silently does nothing.

**Major components:**
1. Frontend UI (React/Vite) — renders button, displays CUID2 string, shows copy confirmation state
2. Tauri IPC bridge (`@tauri-apps/api/core`) — `invoke('generate_cuid')` to Rust, async/await required
3. Rust command handler (`lib.rs`) — `#[tauri::command] fn generate_cuid() -> String` calling `cuid2::create_id()`
4. Clipboard plugin (`tauri-plugin-clipboard-manager`) — cross-platform OS clipboard write; capability-gated
5. Tauri config (`tauri.conf.json` + `capabilities/default.json`) — window size, permissions, bundle settings

**Build dependency order:** Rust scaffold → tauri config + capabilities → `lib.rs` command → frontend `invoke()` wiring → clipboard copy → UI polish.

### Critical Pitfalls

1. **Cross-compilation is impossible** — Tauri cannot build macOS binaries on Windows or vice versa. Configure a GitHub Actions matrix (`[macos-latest, windows-latest]`) before writing any feature code. Never attempt to produce release artifacts from a local single-platform machine.

2. **macOS Gatekeeper is a hard block, not a warning** — unsigned/unnotarized macOS apps produce "App is damaged and can't be opened" with no user bypass path. Obtain an Apple Developer ID certificate ($99/year), notarize every release, and configure signing env vars (`APPLE_CERTIFICATE`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PASSWORD`) in CI from day one. Required entitlements: `com.apple.security.cs.allow-jit` and `com.apple.security.cs.allow-unsigned-executable-memory`.

3. **Clipboard permission silently does nothing without capability grant** — Tauri v2 is deny-by-default. Installing `tauri-plugin-clipboard-manager` without adding `clipboard-manager:allow-write-text` to `capabilities/default.json` results in a copy button that appears to work but doesn't. Verify clipboard in a production `tauri build` on both platforms — behaviour can differ from dev mode.

4. **Tauri v1 documentation is everywhere and breaks v2 builds** — Most tutorials, blog posts, and StackOverflow answers target Tauri v1. Breaking changes: `allowlist` removed (replaced by capabilities), `@tauri-apps/api/tauri` renamed to `@tauri-apps/api/core`, permissions system rewritten. Always read `v2.tauri.app` docs exclusively.

5. **WebView rendering differs between macOS (WebKit) and Windows (WebView2)** — Font rendering, subpixel anti-aliasing, and some CSS edge cases differ. Use a CSS reset, embed a specific monospace font for CUID display (not `font-family: monospace`), and test on both platforms before any release.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Core Feature

**Rationale:** All pitfalls map to Phase 1. Infrastructure (CI, signing, capabilities) must be correct before any feature can be considered done. The core generate-and-copy loop is the only feature; it is also the entire product. Doing this right once eliminates all major risk.

**Delivers:** Working macOS and Windows desktop app that generates a CUID2, auto-copies it to the clipboard, and shows visual confirmation — built and signed by CI on both platforms.

**Addresses features:** Generate CUID2, auto-copy to clipboard, display generated ID, visual copy confirmation, offline operation.

**Avoids pitfalls:** Cross-compilation trap (CI matrix from day one), Gatekeeper blocking (signing configured before first distribution), clipboard silent failure (capability grant verified in production build), v1 API confusion (scaffold from v2 template only), WebView rendering inconsistency (CSS reset + embedded font, tested on both platforms).

**Build sequence within this phase:**
1. Scaffold with `pnpm create tauri-app@latest` (Tauri v2 template, React + TypeScript)
2. Set up GitHub Actions matrix build (macOS + Windows runners)
3. Configure macOS code signing and notarization in CI
4. Add `cuid2` Rust crate; implement `generate_cuid` command in `lib.rs`
5. Add `tauri-plugin-clipboard-manager`; grant `clipboard-manager:allow-write-text` capability
6. Wire frontend: `invoke('generate_cuid')` → display → `writeText()` → copy confirmation
7. UI polish: window sizing (~400x300px), monospace font, Tailwind layout
8. QA checklist: verify clipboard in production build, both platforms

**Research flag:** Standard — Tauri 2 docs are complete and official. No additional research-phase needed. Follow `v2.tauri.app` exclusively.

### Phase 2: Power-User Enhancements

**Rationale:** Add after Phase 1 is validated with real users. These features reduce friction further but are not required to demonstrate value. Each is independently additive — no feature in this phase breaks or changes Phase 1 behaviour.

**Delivers:** Keyboard shortcut to generate, always-on-top window mode, and optionally system tray integration (silent generate + copy with no window focus).

**Addresses features:** Keyboard shortcut (P2), always-on-top (P2), system tray (P2, depends on auto-copy stability from Phase 1).

**Uses stack elements:** Tauri `set_always_on_top` window API, Tauri tray-icon feature, keyboard event listeners in frontend.

**Research flag:** Tray integration needs a quick research pass — Tauri v2 renamed the tray API (`tray-icon` feature flag, not `system-tray`). Always-on-top is a single API call and well-documented.

### Phase 3: Validated Extensions (if demand exists)

**Rationale:** Only build if explicit, repeated user demand exists with a clear use case. These features risk undermining the zero-config, one-click value proposition if added prematurely.

**Delivers:** Configurable CUID2 length (if users demonstrate why the 24-char default fails their use case). No other v2 features recommended without strong signal.

**Deferred indefinitely (anti-features):** History/log of IDs, bulk generation, multi-format support (UUID/NanoID/ULID), settings UI, CUID v1 support, online validation.

### Phase Ordering Rationale

- Phase 1 must contain everything because the app is a single feature — there is no meaningful "later" for the core loop. The only real work is making it ship cleanly on two platforms.
- Phase 2 is gated on Phase 1 validation because system tray integration depends on auto-copy being reliable, and keyboard shortcuts are only worth adding once users demonstrate they're reaching for them.
- Phase 3 is gated on explicit demand signals, not a schedule. The default outcome is that Phase 3 never ships and the app stays at Phase 2 — this is a success, not a failure.
- Architecture is already additive: all potential Phase 2/3 features (tray, shortcuts, configurable length) are additive to the current architecture without restructuring.

### Research Flags

Needs research during Phase 2 planning:
- **Phase 2 (System tray):** Tauri v2 tray API changed from v1; community documentation is sparse for v2 tray. Run a quick `research-phase` before implementing.

Standard patterns (no additional research needed):
- **Phase 1:** All components have complete official Tauri v2 documentation. Follow `v2.tauri.app` exclusively.
- **Phase 1 (CI/signing):** Tauri docs cover macOS notarization and Windows signing with step-by-step env var configuration.
- **Phase 2 (always-on-top, keyboard shortcuts):** Single well-documented Tauri API calls.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies verified via official docs; version numbers confirmed as current as of 2026-03-04 |
| Features | HIGH | Competitor analysis complete; Raycast extension validates auto-copy pattern; anti-features well-justified |
| Architecture | HIGH | Sourced entirely from official Tauri v2 documentation; code patterns verified against current APIs |
| Pitfalls | MEDIUM-HIGH | Critical pitfalls (signing, cross-compilation, capabilities) verified via official docs; rendering inconsistency sourced from community reports |

**Overall confidence:** HIGH

### Gaps to Address

- **Windows SmartScreen signing:** PITFALLS.md flags Windows code signing as required to avoid SmartScreen blocking installers, but does not detail the EV certificate vs standard certificate distinction for CI. Validate Windows signing approach before Phase 1 distribution. Tauri docs at `v2.tauri.app/distribute/sign/windows/` are the starting point.
- **@orama/cuid2 vs @paralleldrive/cuid2 maintenance:** STACK.md notes that `@orama/cuid2` (v2.2.3) is a fork that was "more actively updated as of early 2026." If `@paralleldrive/cuid2` shows signs of abandonment during implementation, evaluate switching. API-compatible, so migration cost is low.
- **Node.js version requirement:** Vite 7 requires Node 20.19+ or 22.12+. CI runners and local dev environments must be pinned to a compatible version. Verify `.nvmrc` or `engines` field is set before onboarding any contributors.

## Sources

### Primary (HIGH confidence)
- [Tauri 2.0 Official Docs](https://v2.tauri.app/) — architecture, project structure, clipboard plugin, signing, capabilities
- [Tauri Clipboard Plugin](https://v2.tauri.app/plugin/clipboard/) — permission model, API usage
- [Tauri macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/) — notarization, entitlements
- [Tauri Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/) — SmartScreen and signing
- [Tauri Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/) — IPC and serialization
- [@paralleldrive/cuid2 on npm](https://www.npmjs.com/package/@paralleldrive/cuid2) — v2.2.2, official implementation
- [Vite 7 Release Notes](https://vite.dev/blog/announcing-vite7) — v7.x current, Node 20+ requirement
- [React 19.2 Release](https://react.dev/blog/2025/10/01/react-19-2) — v19.2.4 current
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4) — v4.x stable, Vite plugin required

### Secondary (MEDIUM confidence)
- [Raycast CUID Generator extension](https://www.raycast.com/dgrcode/cuid-generator) — validates auto-copy pattern; closest feature analogue
- [GitHub: tauri-apps/tauri discussions — cross-platform build](https://github.com/orgs/tauri-apps/discussions/9650) — cross-compilation impossibility confirmed by community
- [Tauri Upgrade from v1 Guide](https://v2.tauri.app/start/migrate/from-tauri-1/) — v1 vs v2 breaking changes
- [Ship Tauri v2 App: Code Signing](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-code-signing-for-macos-and-windows-part-12-3o9n) — practical signing walkthrough

### Tertiary (LOW-MEDIUM confidence)
- [GitHub Issue: Font rendering differs in Tauri vs browsers](https://github.com/tauri-apps/tauri/issues/12638) — single issue report; treat as a real risk but verify during implementation
- [GitHub Discussion: Rendering differences Windows/Linux](https://github.com/tauri-apps/tauri/discussions/12311) — community report on WebKit vs WebView2 differences

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
