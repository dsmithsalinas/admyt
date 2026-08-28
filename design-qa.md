# Sage Plan financial aid lane — design QA

## Visits & interviews MVP addendum

- Desktop builder: `docs/sage-plan-audit/29-visits-interviews-builder-desktop.png`
- Mobile builder: `docs/sage-plan-audit/30-visits-interviews-builder-mobile.png`
- The lane reuses the existing side-card, modal, field, checklist-preview, and
  responsibility patterns. The in-person logistics step visibly assigns the
  parent while all generated work still enters the same weekly task system.
- The 390px layout stacks every field, preserves the modal hierarchy, and keeps
  the primary action reachable through the scrollable dialog.
- Chromium and WebKit browser coverage verifies the dynamic date-to-checklist
  preview and the saved-event detail state.

## Plan focus modes addendum

- Desktop focus bar: `docs/sage-plan-audit/31-plan-focus-bar-desktop.png`
- Mobile focus bar: `docs/sage-plan-audit/32-plan-focus-bar-mobile.png`
- The focus controls sit between global progress and the workbench, preserving
  the distinction between overall plan health and the work currently in view.
- Focus modes are mutually exclusive; the school selector is additive. Counts,
  next attention, weekly groups, empty state, and upcoming deadlines all respond
  immediately without modifying task data.
- On mobile, focus pills become a single horizontal rail while the school
  selector remains full-width and readable.

## Evidence

- Source visual truth: `docs/sage-plan-audit/25-application-builder-source-same-viewport.png`
- Implementation: `docs/sage-plan-audit/26-financial-aid-builder-same-viewport.png`
- Combined comparison: `docs/sage-plan-audit/27-financial-aid-builder-visual-comparison.png`
- Supporting desktop lane: `docs/sage-plan-audit/16-financial-aid-lane-desktop.png`
- Supporting mobile builder: `docs/sage-plan-audit/19-financial-aid-builder-mobile.png`
- Review-flow issue source: `/Users/dustinsmith-salinas/Desktop/Screenshot 2026-08-28 at 11.20.10 AM.png`
- Corrected review state: `docs/sage-plan-audit/28-financial-aid-review.png`
- Viewport: 390 × 844 CSS pixels for both matched builder captures; the combined comparison board is 1280 × 720.
- Source and implementation pixels: 390 × 844 at browser density for both matched captures. No density normalization was required.
- State: both checklist builders open over the signed-in Sage Plan. The financial-aid deadline is filled and both saved schools are selected.

## Full-view comparison

The financial-aid builder preserves the established modal frame, header rhythm,
close action, field treatment, checklist preview, count pill, typography, radii,
and dimmed-page context of the existing application checklist builder. The added
mint intro and selected-school states reuse Sage Plan's existing teal semantic
token rather than introducing a new visual language.

The lane card fits the existing side-column density and ordering. It remains
readable in the single-column mobile layout without horizontal overflow or a
covered primary action.

## Focused-region comparison

The combined comparison focuses on the modal headers, first input, preview-card
header, count treatment, borders, and spacing. These details are large enough to
judge directly. The mobile capture separately verifies field stacking, selected
school affordances, checklist-row wrapping, and bottom-navigation clearance.

## Required fidelity surfaces

- Fonts and typography: Inter, weights, hierarchy, line heights, and sentence-case copy match Sage Plan.
- Spacing and layout rhythm: modal padding, 14–16px gaps, card radii, and mobile stacking match the source pattern.
- Colors and visual tokens: existing ink, muted, indigo, line, mist, and teal tokens are reused with accessible text labels.
- Image quality and asset fidelity: no raster imagery is needed; all visible icons come from the project's existing Lucide library.
- Copy and content: language is short, direct, and explicit about school-specific requirements needing verification.

## Findings

No actionable P0, P1, or P2 differences remain.

## Comparison history

This pass found no P0/P1/P2 mismatch, so no fix-and-recapture loop was required.
The date field was changed from `onChange` to `onInput` after the first browser
exercise so the live preview responds reliably to date entry; the final matched
capture reflects that fix.

The first shipped card reused the setup builder for both “Build” and “Review.”
The reported screenshot showed the resulting empty deadline field and disabled
add action. The card now routes existing checklists to a dedicated review modal,
grouped by household and school. The setup builder is reachable only through
the explicitly labeled “Add or refresh steps” action. The review-to-task and
review-to-setup paths were both exercised against the saved 14-task checklist.

## Follow-up polish

- P3: When trusted school-specific financial-aid requirement data exists, the generic school-form task could become a verified named form.

## Implementation checklist

- [x] Financial-aid lane card matches existing Sage Plan side cards.
- [x] Deadline-driven builder works without persisting test data.
- [x] School selection updates the preview from 14 to 11 tasks.
- [x] Desktop and mobile states render cleanly.
- [x] Requirements remain editable and explicitly ask for source verification.

final result: passed
