# Requirements: CUID Generator

**Defined:** 2026-03-04
**Core Value:** Instantly generate and copy a CUID2 with minimal friction

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Generation

- [ ] **GEN-01**: User can generate a CUID2 by clicking a button
- [ ] **GEN-02**: Generated CUID2 is displayed in a prominent monospace font
- [ ] **GEN-03**: User can copy the CUID2 to clipboard with one click
- [ ] **GEN-04**: CUID2 is auto-copied to clipboard on generation
- [ ] **GEN-05**: User sees visual confirmation when ID is copied

### Distribution

- [ ] **DIST-01**: App builds as a Windows executable (.msi)
- [ ] **DIST-02**: App builds as a macOS application (.dmg)
- [ ] **DIST-03**: App works fully offline with no network dependencies

### UX

- [ ] **UX-01**: Window uses a frameless/minimal design
- [ ] **UX-02**: User can toggle always-on-top mode

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Power User

- **PWR-01**: User can generate CUID2 via keyboard shortcut
- **PWR-02**: App can minimize to system tray

### Distribution

- **DIST-04**: macOS build is code-signed and notarized
- **DIST-05**: Windows build is code-signed

## Out of Scope

| Feature | Reason |
|---------|--------|
| CUID v1 support | v2 is current standard, keeps UI simple |
| History/log of generated IDs | User just needs the current one |
| Bulk generation | Single ID generation covers the use case |
| Settings/configuration panel | No settings needed beyond always-on-top toggle |
| Auto-update mechanism | Overkill for v1 utility app |
| OAuth/UUID/other ID formats | CUID2-only keeps scope tight |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| GEN-01 | — | Pending |
| GEN-02 | — | Pending |
| GEN-03 | — | Pending |
| GEN-04 | — | Pending |
| GEN-05 | — | Pending |
| DIST-01 | — | Pending |
| DIST-02 | — | Pending |
| DIST-03 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |

**Coverage:**
- v1 requirements: 10 total
- Mapped to phases: 0
- Unmapped: 10 ⚠️

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-04 after initial definition*
