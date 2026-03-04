# Phase 1: Core App - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Working app that generates CUID2 with one click, auto-copies to clipboard with visual confirmation, and ships signed binaries for macOS and Windows via CI. No frameless window or always-on-top — those are Phase 2.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
- Generate + copy interaction flow (button behavior, auto-copy timing, visual feedback style)
- Visual design (color scheme, typography, layout, window size)
- Window behavior on launch (empty state vs pre-generated ID)
- CI pipeline structure (GitHub Actions workflow, signing approach)
- Whether to use JS `@paralleldrive/cuid2` or Rust `cuid2` crate for generation

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project

### Established Patterns
- None — first phase establishes all patterns

### Integration Points
- None — no existing code to integrate with

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-core-app*
*Context gathered: 2026-03-04*
