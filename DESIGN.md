# Reservy Design System

This document records the UI conventions currently implemented in `apps/web` and gives design tools a stable source of truth when proposing upgrades.

## Application architecture

- The web app is Next.js 14 using the App Router under `apps/web/src/app`.
- Route segments use `page.tsx` and shared wrappers use `layout.tsx`. The root layout is a Server Component by default.
- Keep components as Server Components unless they need browser APIs, React state/effects, event handlers, or client-only libraries. Add `'use client'` only at the narrowest interactive boundary.
- Keep route-specific UI close to its route or feature module under `apps/web/src`; reusable primitives belong in `apps/web/src/components/ui`.
- Preserve Persian-first localization: document language is `fa`, document direction is `rtl`, and layouts should work with right-to-left text. Use logical CSS properties/utilities where possible.
- Next.js and React versions are `next@^14.2.3` and `react@^18.3.1`.

## Tailwind configuration and theme tokens

Tailwind CSS 3 is configured in `apps/web/tailwind.config.js`. `apps/web/tailwind.config.ts` exposes the same semantic aliases for TypeScript tooling. **The actual application theme color values live only in `apps/web/src/app/globals.css` under `:root`**; both Tailwind configs map semantic utilities to those CSS variables and support opacity modifiers.

| Tailwind utility | CSS token | Current value |
| --- | --- | --- |
| `bg-app` | `--bg-app` | `#10151F` |
| `bg-surface` | `--bg-surface` | `#111726` |
| `bg-surface-hover` | `--bg-surface-hover` | `#172033` |
| `bg-inset` | `--bg-inset` | `#0E131F` |
| `bg-raised` | `--bg-raised` | `#161D2E` |
| `bg-surface-alt` | `--bg-surface-alt` | `#141B2D` |
| `bg-surface-deep` | `--bg-deep` | `#0E1424` |
| Amber utilities / gold accent | `--amber-*`, `--accent-gold` | `amber-500` resolves to `#D4AF37` |
| Gold light | `--accent-gold-light` | `#F3E5AB` |

Use these semantic utilities instead of repeating arbitrary theme hex values in components. For a theme change, update the CSS variables in `globals.css`; component classes and Tailwind aliases should not need edits. Status colors and illustration/data colors are not global theme tokens and can remain local where their meaning is specific.

## Typography

- Use Vazirmatn as the primary family, followed by Tahoma and generic sans-serif.
- The global stylesheet imports Vazirmatn v33.003 from the Rastikerdar CDN and declares `--font-sans: 'Vazirmatn', Tahoma, sans-serif`.
- Tailwind `font-sans` uses the same stack.
- Keep Persian copy readable and respect RTL text flow. Use existing Tailwind weight and size utilities consistently; no separate type scale is defined in the current theme.

## Visual language

- Dark luxury interface with obsidian backgrounds, restrained metallic gold highlights, and slate text.
- Cards use a 1.5rem radius and 1.5rem padding; `luxury-card` and `luxury-glass` are available component-layer styles.
- Use gold for primary emphasis and focus, not as a large-area body color. Borders are subtle; hover states brighten the card and gold border.
- The app background includes subtle radial gold, emerald, and slate glows. Preserve legible contrast over these gradients.
- Respect reduced motion when introducing animation. Existing fades/zoom/tab transitions are defined in `globals.css`.

## Upgrade guidance

- Prefer semantic HTML and accessible names, visible keyboard focus, and clear disabled/loading states.
- Reuse existing primitives in `apps/web/src/components/ui` when they fit; keep new variants compatible with the current Tailwind setup.
- Avoid adding a second source of truth for theme values. Add or update a CSS variable in `globals.css`, then expose it as a semantic Tailwind alias in `tailwind.config.js` when components need a utility class.
