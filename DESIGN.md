# Reservy Design System

This document records the UI conventions currently implemented in `apps/web` and gives design tools a stable source of truth when proposing upgrades.

## Application architecture

- The web app is Next.js 14 using the App Router under `apps/web/src/app`.
- Route segments use `page.tsx` and shared wrappers use `layout.tsx`. The root layout is a Server Component by default.
- Keep components as Server Components unless they need browser APIs, React state/effects, event handlers, or client-only libraries. Add `'use client'` only at the narrowest interactive boundary.
- Keep route-specific UI close to its route or feature module under `apps/web/src`; reusable primitives belong in `apps/web/src/components/ui`.
- Preserve Persian-first localization: document language is `fa`, document direction is `rtl`, and layouts should work with right-to-left text. Use logical CSS properties/utilities where possible.
- Next.js and React versions are `next@^14.2.3` and `react@^18.3.1`.

## Tailwind configuration

Tailwind CSS 3 is configured in `apps/web/tailwind.config.js` and scans `src/pages`, `src/components`, and `src/app`. There is also an `apps/web/tailwind.config.ts` with a different brand palette. The global stylesheet uses the dark luxury palette below; keep new UI aligned with that active palette and resolve the duplicate config before relying on generated theme tokens across environments.

### Active colors

Global CSS custom properties in `apps/web/src/app/globals.css`:

| Token | Value |
| --- | --- |
| App background `--bg-app` | `#10151F` |
| Card `--bg-card` | `#111726` |
| Card hover `--bg-card-hover` | `#172033` |
| Card border `--border-card` | `rgba(212, 175, 55, 0.16)` |
| Gold accent `--accent-gold` | `#D4AF37` |
| Gold light `--accent-gold-light` | `#F3E5AB` |
| Body text | Tailwind `slate-100` (`#f1f5f9`) |

Tailwind theme extensions in the active JavaScript config:

| Family | Shade | Hex |
| --- | ---: | --- |
| `brand` | 50 | `#faf7f0` |
| `brand` | 100 | `#f3edd9` |
| `brand` | 200 | `#e7d8b1` |
| `brand` | 300 | `#d9bd82` |
| `brand` | 400 | `#cba357` |
| `brand` | 500 | `#b88934` |
| `brand` | 600 | `#a3712b` |
| `brand` | 700 | `#835425` |
| `brand` | 800 | `#6d4323` |
| `brand` | 900 | `#5c3720` |
| `brand` | 950 | `#351c0f` |
| `gold` | 50 | `#fdfbf7` |
| `gold` | 100 | `#f9f4e8` |
| `gold` | 200 | `#f2e6cb` |
| `gold` | 300 | `#e8d2a2` |
| `gold` | 400 | `#dba558` |
| `gold` | 500 | `#cfa043` |
| `gold` | 600 | `#b88432` |
| `gold` | 700 | `#946329` |
| `gold` | 800 | `#774f26` |
| `gold` | 900 | `#634223` |
| `obsidian` | 50 | `#f8fafc` |
| `obsidian` | 100 | `#f1f5f9` |
| `obsidian` | 200 | `#e2e8f0` |
| `obsidian` | 800 | `#141a29` |
| `obsidian` | 900 | `#090d16` |
| `obsidian` | 950 | `#04070d` |

The `tailwind.config.ts` alternative defines `brand` as a green scale (`#f0fdf4` through `#052e16`) and `primary` as a slate scale (`#f8fafc` through `#020617`). Do not treat those as the active visual palette until the duplicate config is reconciled.

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
- Avoid adding a second source of truth for theme values. If tokens change, update the active config and global CSS together, then reconcile or remove the conflicting config.
