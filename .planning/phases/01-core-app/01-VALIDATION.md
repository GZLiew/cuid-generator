---
phase: 1
slug: core-app
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-04
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts (Wave 0 installs) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | GEN-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | GEN-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | GEN-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | GEN-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | GEN-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 2 | DIST-01 | manual | — | — | ⬜ pending |
| 01-02-02 | 02 | 2 | DIST-02 | manual | — | — | ⬜ pending |
| 01-02-03 | 02 | 2 | DIST-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest` + `@testing-library/react` + `jsdom` — install test framework
- [ ] `vitest.config.ts` — configure test runner
- [ ] `src/__tests__/App.test.tsx` — stubs for GEN-01 through GEN-05
- [ ] `@tauri-apps/api/mocks` — mock IPC for clipboard tests

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Windows .msi installs cleanly | DIST-01 | Requires Windows OS + installer execution | Build .msi in CI, download artifact, run installer on Windows machine |
| macOS .dmg installs cleanly | DIST-02 | Requires macOS + Gatekeeper validation | Build .dmg in CI, download artifact, open on macOS, verify no Gatekeeper block |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
