# CUID Generator

## What This Is

A lightweight cross-platform desktop app for generating CUID2 identifiers. One button generates a CUID2, displays it, and lets the user copy it to clipboard with a single click. Built with Tauri for small binary size on both Windows and macOS.

## Core Value

Instantly generate and copy a CUID2 with minimal friction — one click to generate, one click to copy.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Generate CUID2 on button click
- [ ] Display generated CUID2 prominently
- [ ] Copy to clipboard with one click
- [ ] Works offline on Windows and macOS
- [ ] Lightweight Tauri-based desktop app

### Out of Scope

- CUID v1 support — v2 is the current standard, keeps UI simple
- History/log of generated IDs — user just needs the current one
- Bulk generation — single ID generation covers the use case
- Settings/configuration — no settings needed for this scope

## Context

- CUID2 is the successor to CUID, designed for secure, collision-resistant ID generation
- Tauri uses Rust backend + web frontend, producing ~5MB binaries vs Electron's 100MB+
- App needs no network access — fully offline operation
- Target: developers who need to quickly grab a CUID2 for testing/development

## Constraints

- **Framework**: Tauri — user-selected for small binary size
- **Platforms**: Windows and macOS — must build for both
- **Offline**: No network dependencies at runtime

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CUID2 over CUID v1 | Secure, no info leakage, current standard | — Pending |
| Tauri over Electron | ~20x smaller binary, better performance | — Pending |

---
*Last updated: 2026-03-04 after initialization*
