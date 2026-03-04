# Feature Research

**Domain:** ID Generator Desktop Utility App (CUID2 focus)
**Researched:** 2026-03-04
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Generate CUID2 on demand | Core purpose of the tool | LOW | Single button or keyboard shortcut trigger |
| Display generated ID prominently | Users need to see what was generated | LOW | Large, readable font; monospace recommended |
| One-click copy to clipboard | Standard pattern in all generator tools; without it users must select-all manually | LOW | Use Tauri's `writeText` clipboard API; show visual confirmation |
| Visual copy confirmation | Prevents uncertainty about whether copy succeeded | LOW | Brief "Copied!" state change on button (icon swap or text flash, ~1.5s) |
| Offline operation | Developers use these tools in restricted network environments | LOW | CUID2 generation is pure computation — no network required |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-copy on generate | Zero-friction workflow: one click generates AND copies — no second click needed | LOW | Generate button triggers clipboard write immediately; display is secondary confirmation. Raycast CUID extension does this; most web tools don't |
| Keyboard shortcut to generate | Keeps hands off the mouse; developer-native interaction pattern | LOW | Bind `Cmd+G` or `Space` to generate; eliminates mouse requirement entirely |
| Always-on-top window mode | Stays accessible while switching between IDE, terminal, and docs | MEDIUM | Tauri supports `set_always_on_top`; niche but valued by power users |
| Tiny window / minimal footprint | Doesn't interrupt the workflow; feels like a tool, not an app | LOW | Compact dimensions (e.g., 300x150px), no chrome, just the ID and button |
| System tray integration | Generate without switching focus at all | MEDIUM | Tauri supports tray; clicking tray icon generates + copies silently. Highest-friction-removal feature |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Bulk generation (generate N at once) | "I need 50 IDs for seeding a database" | Scope creep; this is a one-shot utility, not a data pipeline tool. Bulk users should use the cuid2 npm package directly in a script | Provide a link or tooltip pointing to the cuid2 library for bulk use cases |
| CUID v1 support | Some legacy codebases still use v1 | Adds UI complexity (version selector), v1 has known weaknesses (fingerprinting), and the project explicitly chose v2 | Document in app: "This generates CUID2 — the current standard. For v1, use the cuid npm package." |
| History / log of generated IDs | "I forgot what I generated earlier" | History requires persistence (filesystem or DB), adds state management complexity, and the real fix is auto-copy so the ID is already in the clipboard | Auto-copy on generate eliminates the need to remember |
| Format options (length, uppercase, prefix/suffix) | Power users want customisation | Defeats the "one click, done" core value; every option is a decision to make | CUID2 has a fixed, well-chosen default. Ship the default. If length customisation is validated by user demand, add it post-v1 |
| Settings / preferences UI | Users expect settings in every app | No settings needed for this scope. A settings screen implies there are decisions to make, which contradicts the frictionless goal | Zero-config by design — document the deliberate choice |
| Multi-format support (UUID, NanoID, ULID, etc.) | "While you're at it..." | Scope explosion; requires version pickers, format explanations, documentation. Each format adds cognitive load | Ship CUID2 only. Users needing multiple formats can use uuidgenerator.net or install the relevant library |
| Online validation / API | "Validate an existing CUID2" | Requires network, adds surface area, serves a different use case (debugging, not generation) | Out of scope; direct users to cuidgenerator.com for validation |

## Feature Dependencies

```
[Generate CUID2]
    └──produces──> [Display ID]
    └──produces──> [Copy to Clipboard]  ← auto-copy collapses these two

[Copy to Clipboard]
    └──triggers──> [Visual Copy Confirmation]

[System Tray Integration]
    └──requires──> [Auto-copy on generate]  (tray is only useful if silent copy works)

[Keyboard Shortcut]
    └──enhances──> [Generate CUID2]  (alternative trigger, not a dependency)

[Always-on-top] ──enhances──> [Minimal Window]  (both reduce context-switching cost)
```

### Dependency Notes

- **Display ID requires Generate CUID2:** Nothing to show until generation runs.
- **Visual copy confirmation requires Copy to Clipboard:** Confirmation is a post-copy state; it cannot exist independently.
- **System tray requires auto-copy:** A tray icon that generates but doesn't auto-copy is useless — the user can't see the ID if the window never opens.
- **Always-on-top enhances minimal window:** Both serve the same goal (stay out of the way), so they belong in the same implementation pass if either is built.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] Generate CUID2 on button click — core purpose
- [ ] Auto-copy to clipboard on generate — eliminates the need for a separate copy button; the ID is already in the clipboard before the user looks for it
- [ ] Display generated ID in the window — visual confirmation the generation worked
- [ ] Visual "Copied!" confirmation on button — removes uncertainty about clipboard state
- [ ] Offline operation, Windows + macOS — stated constraint from PROJECT.md

### Add After Validation (v1.x)

Features to add once core is working and users are actively using the tool.

- [ ] Keyboard shortcut to generate — add if users report reaching for keyboard during use
- [ ] Always-on-top mode — add if users report constantly alt-tabbing back to the app
- [ ] System tray integration — add if "I wish it was even faster" feedback is consistent

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] Configurable CUID2 length — only if users explicitly request it and explain why the default length doesn't work for their use case
- [ ] Multi-ID-type support — only if significant demand exists and can be done without polluting the UI

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Generate CUID2 | HIGH | LOW | P1 |
| Display generated ID | HIGH | LOW | P1 |
| Auto-copy to clipboard | HIGH | LOW | P1 |
| Visual copy confirmation | HIGH | LOW | P1 |
| Offline operation | HIGH | LOW | P1 |
| Keyboard shortcut | MEDIUM | LOW | P2 |
| Always-on-top | MEDIUM | MEDIUM | P2 |
| System tray integration | MEDIUM | MEDIUM | P2 |
| Configurable ID length | LOW | LOW | P3 |
| History / log | LOW | HIGH | P3 |
| Bulk generation | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | uuidgenerator.net (web) | Raycast CUID ext. (macOS) | cuidgenerator.com (web) | Our Approach |
|---------|------------------------|---------------------------|-------------------------|--------------|
| Generate ID | Yes | Yes | Yes | Yes |
| One-click copy | Yes | Auto-copy (no-view mode) | Yes | Auto-copy on generate |
| Bulk generation | Yes (up to 1000) | No | Yes (up to 100) | No — anti-feature |
| Format options | Yes (version, case, dashes) | No | Yes (length, v1 vs v2) | No — anti-feature |
| Validation | No | No | Yes | No — out of scope |
| Offline | No | Yes | No | Yes — hard requirement |
| Desktop native | No | Yes (macOS only) | No | Yes (macOS + Windows) |
| Keyboard shortcut | No | Yes (Raycast hotkey) | No | P2 post-launch |
| System tray | No | Via Raycast | No | P2 post-launch |
| History | Yes (last 20 in Chrome ext.) | No | No | No — anti-feature |

**Key gap this app fills:** Raycast's CUID extension is the closest competitor (auto-copy, no UI, fast) but requires Raycast and only works on macOS. This app provides the same zero-friction experience on both Windows and macOS with no other software dependency.

## Sources

- [Raycast CUID Generator extension](https://www.raycast.com/dgrcode/cuid-generator) — closest feature analogue; confirms auto-copy no-view pattern is viable
- [cuidgenerator.com](https://www.cuidgenerator.com/) — most feature-complete CUID web tool; informs what NOT to build (validation, anatomy visualizer, encoder)
- [uuidgenerator.net](https://www.uuidgenerator.net/) — table stakes reference for UUID generator category
- [GitHub: hieuphq/ugen](https://github.com/hieuphq/ugen) — CLI UUID generator; confirms clipboard-first pattern is sufficient for developer tools
- [Tauri v2 docs](https://v2.tauri.app/) — confirmed clipboard API, always-on-top, and tray support
- WebSearch: "UUID generator utility app features" (2026) — category-wide feature survey

---
*Feature research for: CUID Generator desktop utility*
*Researched: 2026-03-04*
