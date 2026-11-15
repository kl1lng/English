# 30english design system

Source of truth for colours, type, space and motion. The CSS variables live in `src/styles/tokens.css`; the generated brand scale (50-950) is in `palette.css` and `tokens.json` (W3C format, can be imported into Figma with Tokens Studio).

## Principles
- Calm, adult, learning-focused. Kazakhstan theme comes from content (places, photos, icons), not from decoration.
- Colours only through variables. No raw hex in components. One theme switch changes everything.
- Text contrast at least 4.5:1, interactive targets at least 44px, visible focus, motion only with transform/opacity and respects reduced motion.

## Brand colours (taken from the app, not from another project)
Navy `#152a41` (text-strong), blue `#4d8be8` (primary) and `#2f6bc4` (primary-strong, for filled buttons with white text: 5.2:1), orange `#f69a62` (accent), green `#4eb69b` (success). Muted text uses `#5a6b80` (5.5:1 on white); the old `#8c99a8` (2.9:1) is for decoration only.

## Tokens
| Group | Tokens |
|---|---|
| Surfaces / text | `--bg`, `--surface`, `--surface-2`, `--text`, `--text-strong`, `--text-muted`, `--border` |
| Actions / states | `--primary`, `--primary-strong`, `--on-primary`, `--accent`, `--success`, `--success-strong`, `--success-bg`, `--warn-text`, `--warn-bg` |
| Type scale | `--fs-xs` 12px, `--fs-sm` 14px, `--fs-md` 16px, `--fs-lg` 20px, `--fs-xl` 28px, `--fs-2xl` 36px |
| Space | `--space-1…8` (4, 8, 12, 16, 24, 32, 48, 64 px) |
| Radius | `--radius-sm` 8px, `--radius-md` 12px, `--radius-lg` 18px |
| Motion | `--dur-fast` 120ms, `--dur-med` 220ms, `--ease-out` |
| Legacy aliases | `--navy`, `--blue`, `--blue-strong`, `--light-blue`, `--orange`, `--line`, `--green`, `--muted` |

## Components and states
Buttons: primary (filled `--primary-strong`), secondary (outline on `--surface`), disabled (opacity 0.5, not-allowed). Cards: `--surface`, `--border`, radius `--radius-lg`. Inputs: visible label, focus ring 3px. Every control has default, hover, focus-visible, disabled; async controls also show loading.

## Audit
`npm run audit:css` lists raw hex colours and font sizes under 12px. Goal: raw hex only inside `tokens.css` and the certificate artwork; no body text under 12px.

## Figma
The Figma connector needs authorization (`/mcp`). Until then tokens are imported from `tokens.json`.
