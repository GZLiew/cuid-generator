# Pitfalls Research

**Domain:** Tauri cross-platform desktop utility app (CUID2 Generator)
**Researched:** 2026-03-04
**Confidence:** MEDIUM-HIGH (Tauri v2 is relatively new; some patterns verified via official docs and community discussions)

## Critical Pitfalls

### Pitfall 1: Cross-Compilation Is Not Supported — Build Must Happen on Target OS

**What goes wrong:**
Developers assume they can build a macOS .dmg and Windows .exe from a single machine. Tauri relies heavily on native toolchains and system libraries, making true cross-compilation impossible without significant workarounds. Attempting to build Windows installers from macOS (or vice versa) leads to toolchain conflicts, missing compilers, and broken builds.

**Why it happens:**
Tauri uses the system WebView (WebKit on macOS, WebView2 on Windows), which requires platform-native compilation. The build toolchain for NSIS Windows installers and macOS .app bundles are platform-specific.

**How to avoid:**
Use GitHub Actions (or any CI) with matrix builds — one macOS runner, one Windows runner. This is the officially recommended path. Never rely on local cross-compilation for release builds.

```yaml
# Minimal GitHub Actions matrix strategy
strategy:
  matrix:
    platform: [macos-latest, windows-latest]
```

**Warning signs:**
- Attempting `cargo tauri build` on macOS and expecting a `.exe` or `.msi` to appear
- Errors referencing missing MSVC toolchain, `link.exe` not found, or NSIS installer tools missing on macOS
- Build succeeds locally but produces only one platform's artifacts

**Phase to address:**
Phase 1 (project setup / CI configuration). Establish the multi-platform CI pipeline before writing any feature code so it is tested early and never becomes a blocker at release time.

---

### Pitfall 2: macOS Gatekeeper Blocks Unsigned/Unnotarized Apps Completely

**What goes wrong:**
Distributing a macOS `.dmg` without code signing and Apple notarization results in Gatekeeper blocking the app entirely. macOS displays "App is damaged and can't be opened. You should move it to the Trash." — not a warning, a hard block. Users cannot open it at all.

**Why it happens:**
macOS Catalina (10.15) and later enforce notarization for all apps distributed outside the Mac App Store. Developers assume this is optional or that users can bypass it easily. In practice, the bypass (`xattr -cr`) is not something you can ask non-technical users to perform.

**How to avoid:**
- Obtain an Apple Developer ID Application certificate ($99/year Apple Developer Program)
- Notarize every release build through Apple's notarization service before distribution
- Configure Tauri's macOS signing via environment variables (`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_TEAM_ID`, `APPLE_PASSWORD`) in CI

Tauri apps specifically require two entitlements for the WebView to function:
- `com.apple.security.cs.allow-jit`
- `com.apple.security.cs.allow-unsigned-executable-memory`

**Warning signs:**
- Building and testing only on your own developer machine (where the app runs unsigned because you built it)
- Skipping signing "to test the feature first" — the signing setup is infrastructure, not an afterthought
- Notarization taking more than 15 minutes indicates a submission error; check logs

**Phase to address:**
Phase 1 (distribution setup). Configure signing and notarization in CI before shipping anything to users. This cannot be retrofitted at the last minute.

---

### Pitfall 3: Clipboard Permission Not Enabled by Default — App Silently Does Nothing

**What goes wrong:**
In Tauri v2, the clipboard plugin requires explicit permission declarations in the capabilities configuration. No clipboard permissions are enabled by default. If you install the plugin but forget to add `write-text` to your capability file, the copy-to-clipboard button will silently fail — no error is thrown to the user, the function just does nothing.

**Why it happens:**
Tauri v2's security-first permission model requires opt-in for every system capability. Developers coming from Tauri v1 (where allowlist had simpler on/off toggles) or from Electron (where clipboard access is implicit) don't expect this.

**How to avoid:**
After installing `@tauri-apps/plugin-clipboard-manager`, explicitly add the required permission to the capability file:

```json
// src-tauri/capabilities/default.json
{
  "permissions": [
    "clipboard-manager:allow-write-text"
  ]
}
```

For this app, only `write-text` is needed (generating and copying a CUID2 string). Do not enable `read-text`, `read-image`, or `write-image` — principle of least privilege.

**Warning signs:**
- Copy button appears to work (no JS error in console) but clipboard contents are unchanged
- Missing `clipboard-manager:allow-write-text` in capability file
- Testing clipboard only in dev mode where behavior may differ from production builds

**Phase to address:**
Phase 1 (core feature implementation). Verify clipboard works on both Windows and macOS before considering any feature complete.

---

### Pitfall 4: Tauri v1 vs v2 API Confusion — Old Docs and Tutorials Silently Break Builds

**What goes wrong:**
The majority of blog posts, tutorials, and StackOverflow answers about Tauri still target v1. Tauri v2 introduced breaking changes that silently produce different behavior or build errors:
- `allowlist` in `tauri.conf.json` is removed and causes a build error in v2
- `@tauri-apps/api/tauri` module was renamed to `@tauri-apps/api/core`
- The permissions system was completely rewritten from allowlist flags to a capabilities file model
- System tray API changed (`tray-icon` feature flag, not `system-tray`)

**Why it happens:**
Tauri v2 stable released in October 2024. Most tutorials predating that are for v1. Developers search for "Tauri clipboard example" and follow v1 instructions without noticing the version discrepancy.

**How to avoid:**
- Always verify you're reading v2 documentation at `v2.tauri.app` (not `v1.tauri.app`)
- When copying code from tutorials or community posts, check the publication date and Tauri version referenced
- Use `tauri migrate` CLI command if starting from any v1 boilerplate

**Warning signs:**
- Build error mentioning `allowlist` is not a valid config property
- Import errors from `@tauri-apps/api/tauri` (should be `@tauri-apps/api/core`)
- `invoke` not working after following a tutorial (check if the handler is registered correctly with `generate_handler!`)

**Phase to address:**
Phase 1 (project scaffolding). Establish the correct v2 stack from day one. Do not scaffold from outdated templates.

---

### Pitfall 5: WebView Rendering Inconsistencies Between Windows and macOS

**What goes wrong:**
Tauri uses WebKit on macOS and WebView2 (Chromium-based) on Windows. These are different rendering engines. CSS that looks correct on macOS may render differently on Windows — font weights, subpixel anti-aliasing, scrollbar appearance, and flex/grid edge cases all differ. For a simple single-screen utility this is low risk, but font rendering specifically is a documented issue.

**Why it happens:**
Developers build and test on one platform (usually macOS) and assume the UI will look identical on Windows. WebKit and Chromium-based renderers handle font rendering, default spacing, and some CSS properties differently.

**How to avoid:**
- Use `normalize.css` or a CSS reset to eliminate browser default differences
- Avoid relying on system fonts — embed a specific font (Inter, JetBrains Mono, etc.) for monospace CUID display
- Test on both platforms before any release, even for minor UI changes
- Use `TAURI_PLATFORM` environment variable for platform-specific CSS if needed

**Warning signs:**
- App only tested on the developer's primary OS before release
- Using `font-family: monospace` without a fallback font stack — platform monospace fonts differ significantly
- CSS that relies on `-webkit-` prefixes without equivalents

**Phase to address:**
Phase 1 (UI implementation). Write CSS defensively from the start; test on both platforms before marking UI tasks complete.

---

### Pitfall 6: IPC Serialization Errors Are Opaque — Custom Types Silently Fail

**What goes wrong:**
All data passed through Tauri's IPC (between Rust backend and JS frontend) must be JSON-serializable. Custom Rust types not implementing `serde::Serialize` or `serde::Deserialize` will fail at compile time or produce opaque runtime errors. Error types from `std::io::Error` and most crates do not implement `Serialize` by default, so returning them from commands produces cryptic failures.

**Why it happens:**
For this project (simple CUID2 generation in the frontend, no Rust command needed for the core feature), this is low risk. The pitfall becomes relevant if any Rust command is added (e.g., file operations, system info). Developers new to Rust/Tauri don't realize error propagation requires wrapping errors in a serializable type.

**How to avoid:**
If any Rust commands are needed, wrap errors in a custom serializable error type:

```rust
#[derive(Debug, serde::Serialize)]
enum AppError {
    Io(String),
}

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::Io(e.to_string())
    }
}
```

Register all commands in a single `generate_handler!` call — calling `invoke_handler` multiple times means only the last one is used.

**Warning signs:**
- Rust compile error mentioning `Serialize` not implemented for a type
- Frontend `invoke()` promise rejects with no meaningful error message
- Multiple `invoke_handler` calls in `main.rs`

**Phase to address:**
Phase 1 (if any Rust backend commands are added). For the current scope (CUID2 generation is pure JS), this pitfall may not apply — but flag it if scope expands.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip code signing for "internal testing" | Faster first build | Cannot share with any macOS user; blocked by Gatekeeper | Never — configure signing in CI from day one |
| Use v1 docs/templates as starting point | Familiar patterns | Allowlist system removed; breaking config errors at build time | Never — start from v2 scaffolding |
| Test only on dev's primary OS | Faster iteration | UI regressions and clipboard failures on the other platform go undetected | Only for initial prototyping, never for "done" |
| Overly broad clipboard permissions (read + write) | Simpler config | Unnecessary system access; violates least-privilege | Never — only enable `write-text` |
| Inline all styles, skip CSS reset | Quick to write | Font and spacing inconsistencies across Windows/macOS | Acceptable in prototype; fix before release |

## Integration Gotchas

Common mistakes when connecting to system APIs and plugins.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| clipboard-manager plugin | Installing npm package without the matching Rust crate version | Ensure npm and crates.io package versions match exactly |
| clipboard-manager plugin | Forgetting to add `clipboard-manager:allow-write-text` to capabilities | Always verify capability file after installing any plugin |
| Apple Notarization | Not including WebView JIT entitlements in the `.entitlements` file | Add `com.apple.security.cs.allow-jit` and `com.apple.security.cs.allow-unsigned-executable-memory` |
| GitHub Actions build | Using a single runner instead of OS matrix | Use `matrix: platform: [macos-latest, windows-latest]` for all release builds |
| CUID2 npm package | Using the deprecated `cuid` package instead of `@paralleldrive/cuid2` | Import from `@paralleldrive/cuid2`; the original `cuid` package is deprecated and insecure |

## Performance Traps

Patterns that work at small scale but fail under specific conditions. For a single-screen utility app, performance traps are minimal, but these are relevant.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Embedding unused Tauri plugins | Larger binary, longer build times | Only add plugins you use; each plugin adds Rust compile time | At 5+ plugins with no pruning |
| Relying on WebView animation for button feedback | Jank on lower-end Windows machines with older WebView2 | Use CSS transitions (not JS animations) for copy feedback | On machines with older WebView2 versions |
| Blocking the main thread during CUID2 generation | UI freeze during generation | CUID2 generation is fast (<1ms); not a real concern for this app | Not applicable at this scale |

## Security Mistakes

Domain-specific security issues for a Tauri utility app.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Enabling more capabilities than needed | Expanded attack surface; clipboard read access could expose sensitive data | Only enable `clipboard-manager:allow-write-text` |
| Loading any remote content in the WebView | XSS and code injection vectors | This app is fully offline; enforce `"csp": "default-src 'self'"` in tauri.conf.json |
| Not verifying CUID2 package integrity | Supply chain attack via compromised npm package | Pin exact versions in `package.json`; use `npm ci` not `npm install` in CI |
| Using `dangerouslyAllowBrowseOrigin` or equivalent CSP bypasses | Remote script execution in a native app context | Never loosen CSP for a utility app with no remote content needs |

## UX Pitfalls

Common user experience mistakes specific to this type of utility app.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual confirmation after copy | User clicks copy and doesn't know if it worked | Show brief "Copied!" state on the button for ~1.5 seconds |
| Displaying CUID2 in a proportional font | Hard to read/verify a 24-char ID | Use monospace font (JetBrains Mono, Fira Code, or system monospace with normalize) |
| Window too large for a utility | App feels heavy; gets in the way | Set a small fixed window size (~400x300px); utility apps should be unobtrusive |
| No keyboard shortcut for copy | Extra friction for developer power users | Bind Cmd+C / Ctrl+C to copy, or Cmd+G / Ctrl+G to generate |
| Window not staying on top of other apps | Developer loses the window behind IDE | Consider "always on top" as a default for a utility — or at minimum as a toggle |

## "Looks Done But Isn't" Checklist

Things that appear complete in development but are missing critical pieces.

- [ ] **Clipboard copy:** Works in dev mode — verify it also works in a `tauri build` production build on both platforms (dev and prod builds handle permissions differently)
- [ ] **macOS distribution:** App runs on your machine — verify it opens on a second macOS machine without Gatekeeper warning (requires notarization)
- [ ] **Windows distribution:** App installs cleanly — verify Windows SmartScreen does not block the installer (requires code signing)
- [ ] **CUID2 output:** Generates an ID — verify the ID is actually a valid CUID2 (starts with a letter, correct length of 24 characters by default, all lowercase alphanumeric)
- [ ] **Copy confirmation:** Copy button registers click — verify the actual clipboard contents match the displayed CUID2 (not a stale value)
- [ ] **Offline operation:** App works in dev with network — verify no external requests are made (check network tab in WebView devtools, enforce offline CSP)

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Unsigned macOS app shipped to users | HIGH | Re-sign and notarize, re-distribute, instruct existing users to delete and re-download |
| Built only for one platform | LOW | Set up CI matrix, add second platform runner, trigger a new release build |
| Wrong Tauri version (v1 patterns in v2) | MEDIUM | Run `npx @tauri-apps/cli migrate`, audit capability files, fix imports from `@tauri-apps/api/core` |
| Clipboard permission missing (silent failure) | LOW | Add `clipboard-manager:allow-write-text` to capability file, rebuild |
| CUID v1 package used instead of CUID2 | LOW | Replace `cuid` with `@paralleldrive/cuid2` in package.json, update import, rebuild |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Cross-compilation not supported | Phase 1 (CI setup) | Both platform binaries produced by CI on every PR |
| macOS Gatekeeper blocking | Phase 1 (distribution config) | App opens on a second macOS machine without warning |
| Clipboard permission not configured | Phase 1 (core feature) | Copy tested in `tauri build` production mode on both platforms |
| Tauri v1 vs v2 API confusion | Phase 1 (scaffolding) | No `allowlist` in config; imports use `@tauri-apps/api/core` |
| WebView rendering inconsistency | Phase 1 (UI implementation) | UI screenshot comparison between Windows and macOS builds |
| IPC serialization errors | Phase 1 (if any Rust commands added) | All Rust commands return `Result<T, SerializableError>` |
| Copy confirmation missing | Phase 1 (UX polish) | Manual QA: button shows feedback state after click |

## Sources

- [Tauri v2 Security Documentation](https://v2.tauri.app/security/) — official capability and CSP guidance
- [Tauri v2 Clipboard Plugin](https://v2.tauri.app/plugin/clipboard/) — permission requirements and platform limitations
- [Tauri macOS Code Signing](https://v2.tauri.app/distribute/sign/macos/) — notarization and entitlement requirements
- [Tauri Windows Code Signing](https://v2.tauri.app/distribute/sign/windows/) — SmartScreen and signing requirements
- [GitHub Discussion: Cross-platform build from macOS](https://github.com/orgs/tauri-apps/discussions/9650) — MEDIUM confidence, community-verified
- [GitHub Issue: Cross-platform compilation v2](https://github.com/tauri-apps/tauri/issues/12312) — MEDIUM confidence, bug report
- [Tauri Upgrade from v1 Guide](https://v2.tauri.app/start/migrate/from-tauri-1/) — official breaking changes list
- [Tauri IPC and Commands](https://v2.tauri.app/develop/calling-rust/) — serialization requirements
- [GitHub Discussion: Rendering differences Windows/Linux](https://github.com/tauri-apps/tauri/discussions/12311) — MEDIUM confidence, community report
- [GitHub Issue: Font rendering differs in Tauri vs browsers](https://github.com/tauri-apps/tauri/issues/12638) — LOW-MEDIUM confidence, single issue report
- [@paralleldrive/cuid2 GitHub](https://github.com/paralleldrive/cuid2) — canonical CUID2 implementation
- [Ship Tauri v2 App: Code Signing](https://dev.to/tomtomdu73/ship-your-tauri-v2-app-like-a-pro-code-signing-for-macos-and-windows-part-12-3o9n) — MEDIUM confidence, community post

---
*Pitfalls research for: Tauri cross-platform desktop utility (CUID2 Generator)*
*Researched: 2026-03-04*
