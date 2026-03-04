# Phase 1: Core App - Research

**Researched:** 2026-03-04
**Domain:** Tauri 2 cross-platform desktop utility (CUID2 generator, clipboard integration, CI/signing pipeline)
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

None — no locked decisions were recorded in CONTEXT.md. All implementation choices are at Claude's discretion.

### Claude's Discretion

- Generate + copy interaction flow (button behavior, auto-copy timing, visual feedback style)
- Visual design (color scheme, typography, layout, window size)
- Window behavior on launch (empty state vs pre-generated ID)
- CI pipeline structure (GitHub Actions workflow, signing approach)
- Whether to use JS `@paralleldrive/cuid2` or Rust `cuid2` crate for generation

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope. UX-01 (frameless window) and UX-02 (always-on-top) are Phase 2; do not implement them in Phase 1.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| GEN-01 | User can generate a CUID2 by clicking a button | Rust `#[tauri::command]` with `cuid2::create_id()` called via frontend `invoke()`; single button trigger |
| GEN-02 | Generated CUID2 is displayed in a prominent monospace font | React `useState` holds the generated string; render in embedded monospace font (JetBrains Mono or Fira Code); large font size |
| GEN-03 | User can copy the CUID2 to clipboard with one click | `writeText()` from `@tauri-apps/plugin-clipboard-manager`; requires `clipboard-manager:allow-write-text` capability grant |
| GEN-04 | CUID2 is auto-copied to clipboard on generation | Generate button calls `invoke()` then immediately calls `writeText()` in the same handler before any re-render; collapses generate + copy into one action |
| GEN-05 | User sees visual confirmation when ID is copied | React state toggle (`copied: boolean`) resets after ~1500ms; button text/icon swaps to "Copied!" then reverts |
| DIST-01 | App builds as a Windows executable (.msi) | GitHub Actions `windows-latest` runner; `tauri-apps/tauri-action@v0`; Windows signing via Azure Key Vault + `relic` or OV cert + HSM |
| DIST-02 | App builds as a macOS application (.dmg) | GitHub Actions `macos-latest` runner; `tauri-apps/tauri-action@v0`; Developer ID Application cert + Apple notarization via env vars |
| DIST-03 | App works fully offline with no network dependencies | CUID2 generation is pure computation; enforce `"csp": "default-src 'self'"` in `tauri.conf.json`; no external CDN or API calls |
</phase_requirements>

---

## Summary

Phase 1 delivers the entire product: a working Tauri 2 desktop app that generates a CUID2, auto-copies it to the clipboard, confirms visually, and ships signed installers for both macOS and Windows via CI. The feature set is small but the infrastructure requirements are significant — code signing and CI matrix configuration must be addressed before distribution, not retrofitted at the last minute.

The recommended architecture routes CUID2 generation through a Rust `#[tauri::command]` backed by the `cuid2` crate, with clipboard access via the official `tauri-plugin-clipboard-manager`. The frontend is a single React component holding one `string | null` state variable — no routing, no state library, no external services. Tailwind CSS v4 handles styling with an embedded monospace font to ensure consistent rendering across the WebKit (macOS) and WebView2 (Windows) engines.

The primary risk area is distribution: Tauri cannot cross-compile, macOS Gatekeeper hard-blocks unsigned apps, and Windows SmartScreen requires code signing to avoid blocking installers. All three issues must be resolved in CI configuration — they cannot be addressed after the fact. The CI pipeline (GitHub Actions matrix + signing) should be the first task completed in this phase, not the last.

**Primary recommendation:** Build Rust scaffold + CI matrix first, then implement the generate-and-copy feature loop, then wire up signing. Every task should verify on both platforms before marking complete.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Tauri | 2.10.x | Desktop app shell (Rust + WebView) | Required by project constraints; ~5MB binary vs Electron's 100MB+ |
| React | 19.2.x | UI framework | Best TypeScript support; most Tauri community templates and examples target React |
| TypeScript | 5.9.x | Type safety | Catches IPC type errors at compile time; standard in all Tauri v2 templates |
| Vite | 7.x | Frontend build tool | Officially recommended by Tauri; native ESM; direct Tauri CLI integration |
| Tailwind CSS | 4.x | Styling | CSS-first config in v4 (no config file); 5x faster builds; correct for a small single-screen UI |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @paralleldrive/cuid2 | 2.2.2 | Generate CUID2 in JS (if used for generation) | Discretionary — JS generation is simpler to scaffold; Rust crate is more authoritative |
| cuid2 (Rust crate) | latest | Generate CUID2 in Rust backend | Preferred — canonical implementation; recommended by prior research |
| @tauri-apps/plugin-clipboard-manager | 2.3.2 | Write to OS clipboard | Always — only reliable clipboard path in Tauri's WebView context |
| @tauri-apps/api | 2.10.x | Tauri JS bridge (`invoke`, events) | Always — installed by default via scaffold |
| @tauri-apps/api/mocks | 2.10.x | Mock Tauri APIs in Vitest | In test files only — required for unit testing `invoke()` without a native webview |

### Development Tools

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| pnpm | latest | Package manager | Recommended by Tauri docs; faster than npm, better monorepo support |
| @tauri-apps/cli | 2.10.x | Build, dev, bundle | Use npm wrapper (`pnpm tauri dev`, `pnpm tauri build`) |
| Rust (rustup stable) | stable | Compile Tauri backend | Required; install via rustup.rs |
| Vitest | latest | Frontend unit tests | Officially supported; mock-first model for Tauri IPC |
| @testing-library/react | latest | React component testing | Test generate button, copy confirmation state |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Rust `cuid2` crate | JS `@paralleldrive/cuid2` | JS is simpler to scaffold; Rust is the canonical implementation — use Rust for correctness |
| React 19 | Svelte 5 | Svelte compiles away the framework overhead; both are valid; React has more Tauri community examples |
| Tailwind CSS v4 | CSS Modules | CSS Modules offer strict encapsulation; Tailwind is faster for a single-screen utility |

**Installation:**

```bash
# Scaffold Tauri 2 + React + TypeScript
pnpm create tauri-app@latest cuid-generator --template react-ts

cd cuid-generator

# Clipboard plugin (JS side)
pnpm add @tauri-apps/plugin-clipboard-manager

# Tailwind CSS v4
pnpm add tailwindcss @tailwindcss/vite

# Rust-side clipboard plugin (registered via CLI, adds to Cargo.toml)
pnpm tauri add clipboard-manager

# Testing
pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom
```

Note: If using the JS cuid2 library instead of the Rust crate:
```bash
pnpm add @paralleldrive/cuid2
```

---

## Architecture Patterns

### Recommended Project Structure

```
cuid-generator/
├── package.json                    # Frontend deps + tauri CLI scripts
├── vite.config.ts                  # Vite config: @tailwindcss/vite plugin
├── index.html                      # SPA entry
├── src/                            # Frontend source
│   ├── main.tsx                    # App bootstrap
│   ├── App.tsx                     # Root component (entire UI lives here)
│   ├── App.test.tsx                # Vitest unit tests
│   └── styles.css                  # @import "tailwindcss"
└── src-tauri/                      # Rust backend (separate from src/)
    ├── Cargo.toml                  # cuid2 + tauri-plugin-clipboard-manager
    ├── Cargo.lock
    ├── build.rs                    # Tauri build script (boilerplate)
    ├── tauri.conf.json             # Window size, identifier, CSP, bundle
    ├── capabilities/
    │   └── default.json            # clipboard-manager:allow-write-text
    ├── icons/                      # App icons (tauri icon command)
    └── src/
        ├── main.rs                 # Desktop entry point — delegates to lib.rs
        └── lib.rs                  # generate_cuid command + plugin init
```

### Pattern 1: Rust Command for CUID2 Generation

**What:** CUID2 generation runs as a `#[tauri::command]` in Rust, returning a plain string over IPC.
**When to use:** Always in this project — the Rust `cuid2` crate is the canonical implementation.

```rust
// Source: https://v2.tauri.app/develop/calling-rust/
// src-tauri/src/lib.rs
use cuid2::create_id;

#[tauri::command]
fn generate_cuid() -> String {
    create_id()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![generate_cuid])
        .run(tauri::generate_context!())
        .expect("error running tauri application")
}
```

```typescript
// src/App.tsx
import { invoke } from '@tauri-apps/api/core';

const id = await invoke<string>('generate_cuid');
```

### Pattern 2: Clipboard via Official Plugin

**What:** Use `writeText()` from `@tauri-apps/plugin-clipboard-manager` — never `navigator.clipboard.writeText()`.
**When to use:** Always — the browser clipboard API is unreliable in Tauri's WebView without user-gesture focus.

```typescript
// Source: https://v2.tauri.app/plugin/clipboard/
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

await writeText(generatedCuid);
```

```json
// src-tauri/capabilities/default.json
{
  "identifier": "default",
  "platforms": ["macOS", "windows"],
  "permissions": [
    "core:default",
    "clipboard-manager:allow-write-text"
  ]
}
```

### Pattern 3: Auto-Copy on Generate (GEN-04)

**What:** The generate button handler calls `invoke()` and immediately calls `writeText()` before any state update. The ID lands in the clipboard before the user reads it from the screen.
**When to use:** This is the core interaction model — collapses generate + copy into one action.

```typescript
// src/App.tsx
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

function App() {
  const [cuid, setCuid] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    const id = await invoke<string>('generate_cuid');
    await writeText(id);           // auto-copy immediately
    setCuid(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div>
      <p className="font-mono text-2xl">{cuid ?? '—'}</p>
      <button onClick={handleGenerate}>
        {copied ? 'Copied!' : 'Generate'}
      </button>
    </div>
  );
}
```

### Pattern 4: Vitest Mocking for Tauri IPC

**What:** Unit tests mock `invoke()` using `@tauri-apps/api/mocks` so tests run in Node without a native webview.
**When to use:** All frontend unit tests that call `invoke()` or clipboard plugin functions.

```typescript
// Source: https://v2.tauri.app/develop/tests/mocking/
// src/App.test.tsx
import { beforeAll, beforeEach, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { randomFillSync } from 'crypto';
import App from './App';

beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: { getRandomValues: (buffer: Buffer) => randomFillSync(buffer) },
  });
});

beforeEach(() => clearMocks());

test('generate button produces a CUID2 and shows Copied state', async () => {
  mockIPC((cmd) => {
    if (cmd === 'generate_cuid') return 'clxxxxxxxxxxxxxxxxxxxxxxxx';
  });

  render(<App />);
  fireEvent.click(screen.getByText('Generate'));
  await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
});
```

### Pattern 5: GitHub Actions CI Matrix

**What:** Build macOS and Windows binaries on their native runners — Tauri cannot cross-compile.
**When to use:** Every release build. Configure this before implementing any features.

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build-and-release:
    strategy:
      matrix:
        include:
          - platform: macos-latest
            args: '--target aarch64-apple-darwin'
          - platform: macos-latest
            args: '--target x86_64-apple-darwin'
          - platform: windows-latest
            args: ''

    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Cache Rust
        uses: swatinem/rust-cache@v2

      - name: Install frontend deps
        run: pnpm install

      - name: Build and release
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS signing
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          # Windows signing (Azure Key Vault approach)
          AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
        with:
          tagName: app-v__VERSION__
          releaseName: 'CUID Generator v__VERSION__'
          args: ${{ matrix.args }}
```

### Anti-Patterns to Avoid

- **`navigator.clipboard.writeText()`:** Unreliable in Tauri's WebView without focused window + user gesture. Use `writeText()` from `@tauri-apps/plugin-clipboard-manager` exclusively.
- **Generating CUID2 in JS only:** Bypasses the Rust backend entirely. Use the `cuid2` Rust crate via `#[tauri::command]`.
- **Missing capability grant:** Installing `tauri-plugin-clipboard-manager` without adding `clipboard-manager:allow-write-text` to `capabilities/default.json` causes silent failure — clipboard appears to work but doesn't copy anything.
- **Multiple `invoke_handler` calls in `lib.rs`:** Only the last `invoke_handler` is used. Register all commands in a single `tauri::generate_handler![cmd1, cmd2]` call.
- **Reading Tauri v1 docs:** `allowlist` is removed in v2; `@tauri-apps/api/tauri` is renamed to `@tauri-apps/api/core`. Always read `v2.tauri.app` exclusively.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CUID2 generation | Custom ID algorithm | `cuid2` Rust crate | Collision resistance requires a correctly-seeded PRNG and the spec's fingerprint salting — subtle to get right |
| Clipboard access | Custom Rust command calling OS clipboard APIs | `tauri-plugin-clipboard-manager` | Platform differences (macOS pasteboard vs Windows clipboard) are already handled; rolling your own risks platform-specific bugs |
| App bundle creation | Custom build scripts | `tauri-apps/tauri-action@v0` | Handles .app, .dmg, .msi packaging, signing hooks, and GitHub release creation — significant undifferentiated work |
| macOS notarization | Custom `xcrun notarytool` calls | Tauri's built-in notarization (env vars) | Tauri reads `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` and notarizes automatically during `tauri build` |
| Cross-platform CSS reset | Custom normalize styles | `normalize.css` or Tailwind's built-in Preflight | WebKit vs WebView2 rendering differences are well-documented; use the proven reset |

**Key insight:** This app's complexity is entirely in distribution infrastructure. The feature code itself is ~30 lines. Every hour spent hand-rolling packaging, signing, or clipboard logic is an hour not spent validating with real users.

---

## Common Pitfalls

### Pitfall 1: Cross-Compilation Is Impossible — CI Matrix Required From Day One
**What goes wrong:** Attempting `cargo tauri build` on macOS expecting a `.msi` or `.exe`. Fails with missing MSVC toolchain or NSIS installer tools.
**Why it happens:** Tauri uses the system WebView (WebKit on macOS, WebView2 on Windows), which requires platform-native compilation.
**How to avoid:** GitHub Actions matrix with `macos-latest` and `windows-latest` runners. Set this up before any feature work — it must be proven to work on the first commit, not retroactively configured.
**Warning signs:** Seeing only one platform's artifacts in CI output; `link.exe not found` errors on macOS.

### Pitfall 2: macOS Gatekeeper Hard-Blocks Unsigned Apps
**What goes wrong:** Users download the `.dmg` and get "App is damaged and can't be opened. You should move it to the Trash." — a hard block with no bypass for non-technical users.
**Why it happens:** macOS Catalina+ enforces notarization for all apps distributed outside the App Store. Developers test on their own machine (where the locally-built app runs unsigned) and don't discover this until users report it.
**How to avoid:**
- Obtain a Developer ID Application certificate (requires Apple Developer Program, $99/year)
- Configure signing in CI via env vars: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`
- Required entitlements for Tauri WebView: `com.apple.security.cs.allow-jit` and `com.apple.security.cs.allow-unsigned-executable-memory`
- Notarization happens automatically when these env vars are set during `tauri build`
**Warning signs:** App opens on the build machine but shows Gatekeeper warning on any other macOS machine.

### Pitfall 3: Windows SmartScreen Blocks Insufficiently Signed Installers
**What goes wrong:** Windows SmartScreen shows a blocking warning on the `.msi` installer. Users must click through "More info" → "Run anyway" — a friction point that damages trust.
**Why it happens:** SmartScreen evaluates both the certificate type and the app's reputation (download count + time).

**Certificate options (choose one):**

| Option | Cost | SmartScreen Behavior | Notes |
|--------|------|----------------------|-------|
| EV (Extended Validation) cert | ~$400+/year | Immediate trust — no warning | Requires hardware token (HSM); CI must use Azure Key Vault or similar |
| OV (Organization Validated) cert post-June 2023 | ~$100–200/year | Warning shown until reputation builds | New OV certs must be stored on HSMs; Azure Key Vault approach required for CI |
| No signing | Free | Hard block on most Windows machines | Unacceptable for distribution |

**Recommended CI approach for Windows signing (OV or EV cert via Azure Key Vault):**
```json
// src-tauri/tauri.conf.json (add signCommand)
{
  "bundle": {
    "windows": {
      "signCommand": "relic sign --config relic.yml -k azure %1"
    }
  }
}
```
Required CI env vars: `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET`.
**Warning signs:** Users reporting "Windows protected your PC" popup; CI builds succeed but installer is unsigned.

### Pitfall 4: Clipboard Permission Silently Does Nothing
**What goes wrong:** Copy button appears to work (no JS error in console) but the clipboard is unchanged. This is especially confusing because the generate button may update state correctly.
**Why it happens:** Tauri v2 is deny-by-default. Plugin installation alone does not grant access — `capabilities/default.json` must explicitly include `clipboard-manager:allow-write-text`.
**How to avoid:** Immediately after `pnpm tauri add clipboard-manager`, add the permission to the capabilities file. Verify clipboard in a `tauri build` production build, not just in dev mode (behavior can differ).
**Warning signs:** Copy confirmation appears but clipboard contents are stale or empty; no error in browser devtools console.

### Pitfall 5: Tauri v1 Docs Silently Break v2 Builds
**What goes wrong:** Build error mentioning `allowlist` is not a valid config property, or `invoke` not working after following a tutorial.
**Why it happens:** Most blog posts, StackOverflow answers, and community examples target Tauri v1. Tauri v2 (stable October 2024) has breaking changes: `allowlist` removed, `@tauri-apps/api/tauri` renamed to `@tauri-apps/api/core`, permission model rewritten.
**How to avoid:** Read `v2.tauri.app` exclusively. When copying any code found online, check the publication date and Tauri version.
**Warning signs:** Import errors from `@tauri-apps/api/tauri`; build error saying `allowlist` is unknown.

### Pitfall 6: WebView Rendering Differs Between macOS (WebKit) and Windows (WebView2)
**What goes wrong:** UI looks correct on macOS but font rendering, subpixel anti-aliasing, and spacing differ on Windows.
**Why it happens:** Two different rendering engines. `font-family: monospace` maps to different fonts on each OS.
**How to avoid:** Embed a specific monospace font (JetBrains Mono or Fira Code via CSS `@font-face` or a CDN-free local import). Use Tailwind's Preflight reset. Test on both platforms before marking any UI task done.
**Warning signs:** Only testing UI on the developer's primary OS; using bare `font-family: monospace` without an explicit typeface.

---

## Code Examples

Verified patterns from official sources:

### Rust: generate_cuid command
```rust
// Source: https://v2.tauri.app/develop/calling-rust/
// src-tauri/src/lib.rs
use cuid2::create_id;

#[tauri::command]
fn generate_cuid() -> String {
    create_id()
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![generate_cuid])
        .run(tauri::generate_context!())
        .expect("error running tauri application")
}
```

### Rust: Cargo.toml dependencies
```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-clipboard-manager = "2"
cuid2 = "0"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
```

### Frontend: Auto-copy generate handler
```typescript
// Source: https://v2.tauri.app/plugin/clipboard/ + https://v2.tauri.app/develop/calling-rust/
import { invoke } from '@tauri-apps/api/core';
import { writeText } from '@tauri-apps/plugin-clipboard-manager';

async function handleGenerate() {
  try {
    const id = await invoke<string>('generate_cuid');
    await writeText(id);
    // update state after successful generate + copy
  } catch (err) {
    console.error('Generate/copy failed:', err);
  }
}
```

### Capabilities: clipboard write permission
```json
// Source: https://v2.tauri.app/plugin/clipboard/
// src-tauri/capabilities/default.json
{
  "identifier": "default",
  "platforms": ["macOS", "windows"],
  "permissions": [
    "core:default",
    "clipboard-manager:allow-write-text"
  ]
}
```

### Tauri config: window sizing and CSP
```json
// src-tauri/tauri.conf.json (relevant sections)
{
  "app": {
    "windows": [
      {
        "title": "CUID Generator",
        "width": 420,
        "height": 260,
        "resizable": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'"
    }
  }
}
```

### Vitest: mock IPC for unit tests
```typescript
// Source: https://v2.tauri.app/develop/tests/mocking/
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
```

```typescript
// src/App.test.tsx
import { beforeAll, beforeEach, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { mockIPC, clearMocks } from '@tauri-apps/api/mocks';
import { randomFillSync } from 'crypto';
import App from './App';

beforeAll(() => {
  Object.defineProperty(window, 'crypto', {
    value: { getRandomValues: (buffer: Buffer) => randomFillSync(buffer) },
  });
});

beforeEach(() => clearMocks());

test('clicking Generate shows Copied! state', async () => {
  mockIPC((cmd) => {
    if (cmd === 'generate_cuid') return 'clxxxxxxxxxxxxxxxxxxxxxxxx';
  });
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /generate/i }));
  await waitFor(() => expect(screen.getByText(/copied!/i)).toBeInTheDocument());
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tauri v1 `allowlist` in `tauri.conf.json` | Tauri v2 capabilities files (`capabilities/default.json`) | October 2024 (Tauri v2 stable) | Old tutorials use `allowlist`; causes build error in v2 |
| `import { invoke } from '@tauri-apps/api/tauri'` | `import { invoke } from '@tauri-apps/api/core'` | October 2024 (Tauri v2 stable) | Old import path causes runtime error |
| PostCSS-based Tailwind setup (`tailwind.config.js`) | `@tailwindcss/vite` plugin + `@import "tailwindcss"` in CSS | January 2025 (Tailwind v4) | No config file needed; PostCSS setup breaks with v4 |
| `navigator.clipboard.writeText()` in Tauri | `@tauri-apps/plugin-clipboard-manager` `writeText()` | Tauri v2 (capability model) | Browser clipboard API is unreliable without user-gesture focus in WebView |
| OV certs as exportable files | OV certs require HSM (hardware token or Azure Key Vault) | June 2023 (CA/Browser Forum) | All Tauri v1 Windows signing guides that export the cert file are now invalid for new certificates |

**Deprecated/outdated:**
- Tauri v1 (`v1.tauri.app`): EOL; all community activity moved to v2
- `cuid` npm package (v1): Deprecated; leaks system information in generated IDs; use `@paralleldrive/cuid2`
- Tailwind CSS v3 + `tailwind.config.js`: Still functional but v4's CSS-first config is the current approach for new projects

---

## Open Questions

1. **`@paralleldrive/cuid2` version — is there a v3.x?**
   - What we know: Prior research confirmed v2.2.2 as current; one search result claimed v3.3.0 but no GitHub releases corroborate this and npmpackage.info still shows 2.2.2
   - What's unclear: Whether a major v3 release exists and what it changes
   - Recommendation: Check `npm info @paralleldrive/cuid2 version` at implementation time; if v3 exists, review the changelog before adopting it. The Rust `cuid2` crate is the canonical source of truth regardless.

2. **Windows signing certificate choice — EV vs OV for a new app**
   - What we know: EV certificates provide immediate SmartScreen trust; OV certs post-June 2023 require HSMs; both can be used with Azure Key Vault in CI
   - What's unclear: Whether an OV cert reputation builds fast enough for a v1 release to not frustrate early users
   - Recommendation: If budget permits, start with an EV cert to avoid SmartScreen friction entirely. If not, use an OV cert via Azure Key Vault and document the expected SmartScreen warning in the release notes. The Tauri docs at `v2.tauri.app/distribute/sign/windows/` provide the current Azure Key Vault + `relic` signing setup.

3. **Node.js version pinning**
   - What we know: Vite 7 requires Node 20.19+ or 22.12+; this is a known constraint from prior research
   - What's unclear: Whether CI runners (`macos-latest`, `windows-latest`) default to a compatible Node version
   - Recommendation: Explicitly set `node-version: '22'` in the GitHub Actions `setup-node` step; add `.nvmrc` with `22` for local dev consistency.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (latest) + @testing-library/react |
| Config file | `vitest.config.ts` — Wave 0 creation required |
| Quick run command | `pnpm vitest run` |
| Full suite command | `pnpm vitest run --coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GEN-01 | Generate button calls `invoke('generate_cuid')` | unit | `pnpm vitest run src/App.test.tsx` | Wave 0 |
| GEN-02 | Generated CUID2 is rendered with monospace font class | unit | `pnpm vitest run src/App.test.tsx` | Wave 0 |
| GEN-03 | Copy button calls `writeText()` with current CUID | unit | `pnpm vitest run src/App.test.tsx` | Wave 0 |
| GEN-04 | Auto-copy: `writeText()` called immediately after `invoke()` in same handler | unit | `pnpm vitest run src/App.test.tsx` | Wave 0 |
| GEN-05 | "Copied!" text appears after generation; reverts after ~1500ms | unit | `pnpm vitest run src/App.test.tsx` | Wave 0 |
| DIST-01 | Windows `.msi` artifact produced by CI | smoke (manual) | `gh run list --workflow release.yml` — verify artifact presence | manual-only |
| DIST-02 | macOS `.dmg` artifact produced by CI | smoke (manual) | `gh run list --workflow release.yml` — verify artifact presence | manual-only |
| DIST-03 | No network requests at runtime | smoke (manual) | Check DevTools network tab in production build with network disabled | manual-only |

DIST-01, DIST-02, DIST-03 are manual-only because they require running native installers on actual OS instances — they cannot be automated in a unit test environment.

### Sampling Rate

- **Per task commit:** `pnpm vitest run`
- **Per wave merge:** `pnpm vitest run --coverage`
- **Phase gate:** Full suite green + manual smoke test of both platform installers before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `vitest.config.ts` — Vitest config with `environment: 'jsdom'`
- [ ] `src/App.test.tsx` — covers GEN-01 through GEN-05
- [ ] Framework install: `pnpm add -D vitest @testing-library/react @testing-library/user-event jsdom`

---

## Sources

### Primary (HIGH confidence)

- [Tauri v2 Official Docs](https://v2.tauri.app/) — architecture, IPC, clipboard plugin, capabilities model
- [Tauri Calling Rust from Frontend](https://v2.tauri.app/develop/calling-rust/) — `invoke()`, `#[tauri::command]`, `generate_handler!`
- [Tauri Clipboard Plugin](https://v2.tauri.app/plugin/clipboard/) — `writeText()`, permission requirements
- [Tauri macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/) — notarization, `APPLE_*` env vars, entitlements
- [Tauri Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/) — EV vs OV certificates, Azure Key Vault + relic approach, `AZURE_*` env vars
- [Tauri GitHub Actions Pipeline](https://v2.tauri.app/distribute/pipelines/github/) — `tauri-apps/tauri-action@v0`, matrix strategy
- [Tauri Mock Tauri APIs](https://v2.tauri.app/develop/tests/mocking/) — `mockIPC()`, `clearMocks()`, WebCrypto polyfill
- [Prior project research: STACK.md](.planning/research/STACK.md) — stack versions verified 2026-03-04
- [Prior project research: ARCHITECTURE.md](.planning/research/ARCHITECTURE.md) — Tauri architecture patterns, IPC data flow
- [Prior project research: PITFALLS.md](.planning/research/PITFALLS.md) — cross-compilation, Gatekeeper, capabilities pitfalls

### Secondary (MEDIUM confidence)

- [Ship Your Tauri v2 App: Code Signing (Part 1/2)](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-code-signing-for-macos-and-windows-part-12-3o9n) — practical walkthrough for macOS + Windows signing in CI; verified against official docs
- [Ship Your Tauri v2 App: GitHub Actions (Part 2/2)](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-github-actions-and-release-automation-part-22-2ef7) — release automation workflow example
- [Microsoft Learn: OV cert reputation and SmartScreen](https://learn.microsoft.com/en-us/answers/questions/417016/reputation-with-ov-certificates-and-are-ev-certifi) — EV vs OV SmartScreen behavior explained
- [Tauri GitHub discussion: cross-platform build from macOS](https://github.com/orgs/tauri-apps/discussions/9650) — cross-compilation impossibility confirmed by community

### Tertiary (LOW confidence — flag for validation)

- Search result claiming `@paralleldrive/cuid2` v3.3.0 exists — not corroborated by GitHub releases or npmpackage.info; verify at implementation time

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all technologies verified via official docs; versions confirmed as current as of 2026-03-04
- Architecture: HIGH — sourced from official Tauri v2 documentation; code patterns verified against current APIs
- CI/signing: HIGH — official Tauri signing guides verified; Azure Key Vault approach confirmed for post-June 2023 certs
- Pitfalls: MEDIUM-HIGH — critical pitfalls verified via official docs; Windows SmartScreen behavior sourced from Microsoft Learn and Tauri community
- Test setup: HIGH — official Tauri mocking docs; Vitest is the standard frontend test framework

**Research date:** 2026-03-04
**Valid until:** 2026-06-04 (90 days; Tauri releases new minor versions monthly but the patterns are stable within v2)
