# Roadmap: CUID Generator

## Overview

Two phases deliver the complete v1 product. Phase 1 builds the working app end-to-end — Tauri scaffold, CUID2 generation, auto-copy, visual confirmation, and a signed CI pipeline that produces artifacts for both macOS and Windows. Phase 2 layers on the window presentation enhancements (frameless design, always-on-top toggle) that make the app feel purpose-built for developers rather than generic. Distribution infrastructure is part of Phase 1 because cross-compilation requires CI from day one and macOS Gatekeeper is a hard block, not a warning.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Core App** - Working app that generates CUID2, auto-copies to clipboard, and ships signed binaries for macOS and Windows via CI
- [ ] **Phase 2: UX Polish** - Frameless window design and always-on-top mode that make the app feel purpose-built

## Phase Details

### Phase 1: Core App
**Goal**: Users can generate a CUID2 with one click, have it automatically in their clipboard with visual confirmation, and install the app on both Windows and macOS
**Depends on**: Nothing (first phase)
**Requirements**: GEN-01, GEN-02, GEN-03, GEN-04, GEN-05, DIST-01, DIST-02, DIST-03
**Success Criteria** (what must be TRUE):
  1. User clicks one button and a CUID2 appears on screen in a large, readable monospace font
  2. The generated CUID2 is automatically in the user's clipboard the moment it appears — no second click required
  3. User sees a brief "Copied!" confirmation on the button after generation
  4. A signed .msi installer is produced by CI and installs cleanly on Windows without SmartScreen blocking
  5. A notarized .dmg is produced by CI and opens cleanly on macOS without Gatekeeper blocking
**Plans**: TBD

### Phase 2: UX Polish
**Goal**: The app window feels purpose-built — minimal chrome, stays on top when the user wants it
**Depends on**: Phase 1
**Requirements**: UX-01, UX-02
**Success Criteria** (what must be TRUE):
  1. The app window has no system title bar or frame — only the app content is visible
  2. User can toggle always-on-top mode so the window remains visible while switching to other apps
  3. Both behaviors work identically on macOS and Windows
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Core App | 0/TBD | Not started | - |
| 2. UX Polish | 0/TBD | Not started | - |
