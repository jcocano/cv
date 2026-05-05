# cv

> _My CV as an app. Not a PDF. Same discipline I'd use in production._

[![CI](https://github.com/jcocano/cv/actions/workflows/ci.yml/badge.svg)](https://github.com/jcocano/cv/actions/workflows/ci.yml)
[![Built with Astro](https://astro.badg.es/v2/built-with-astro/tiny.svg)](https://astro.build)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## See it live

Live demo: **[jcocano.github.io/cv](https://jcocano.github.io/cv)**.

Instead of a static screenshot, the visual side of the site is covered by [Playwright visual baselines](tests/visual/__snapshots__/) committed alongside the code. Every page × theme × language combination is captured as a PNG and compared against future runs with `maxDiffPixelRatio: 0.0`. A single byte of pixel difference fails the suite. For that to work across machines, the suite runs inside the official Playwright Docker image (pinned Chromium, system fonts, libraries), so local and CI render byte-identical pixels.

Visual regressions show up as a normal file diff in any PR, and you can browse the UI's evolution by following those PNGs through git history. Watch a UI change land like any other file diff.

## Why this exists

It started as a utility. A quick way to share a CV link instead of attaching a PDF every time. Eventually it turned into a portfolio. Today it's read by a mixed audience: recruiters skimming the repo, curious visitors landing from my profile, and engineering folks who want to see how I work.

Astro because building a backend for content that barely changes felt like over-engineering. Static output keeps it fast, MDX lets me write content without a CMS, it's framework-agnostic, and the MCP integration was a nice bonus.

## Decisions

A few decisions I made deliberately and would defend in a code review:

- **No `any` in TypeScript, anywhere, including tests.** If I'm tempted to reach for `any`, that's a smell. Either the type is wrong or the logic is. Strong typing isn't just a safety net. It's how I know, at every moment, where I am in the code and what I expect to happen next. When something is genuinely dynamic I reach for `unknown` + narrowing, generics, or a Zod-derived type. The few extra minutes of modeling pay back the same day, not in some imaginary future refactor.

- **TDD, but only where it pays.** Unit tests for logic and helpers. Render-tests (via `experimental_AstroContainer`) for components with branching. No tests on pure presentational templates: visual parity already covers those. I don't believe in test theater for stateless markup.

- **One URL set serves both languages.** I'm Mexican, and the site being bilingual was a dealbreaker for me. A small way of keeping my roots in the project. Astro ships native i18n routing (`/es/...`, `/en/...`), but I didn't want to maintain two URL trees just to be polite to language detectors. So every translatable string is `{ es, en }`, validated by Zod, and the language toggle just mutates a `data-lang` attribute on the root. One tree, no drift. ¡Viva México, cabrones! 🌮

- **Vanilla TypeScript, no UI framework.** Not everything needs React. For a site this size, picking a UI framework is choosing 30-50 KB of runtime to solve a problem you don't have. The theme toggle, language toggle, scroll observers, and the Lab pieces are all plain script modules from `src/lib/`. Zero framework runtime, faster paint, and anyone reading the source can follow the behavior without learning a framework first. Frameworks earn their keep in apps. On small sites, they're just runtime tax.

- **Plain CSS modules, no Tailwind.** I genuinely love Tailwind. The velocity it gives you is hard to argue with, and I think it deserves more credit than it gets in some circles. But once I'd committed to no UI framework, pulling in Tailwind felt incoherent: a site with zero JS runtime shouldn't carry a CSS engine to compensate. So each component owns its `.module.css`, design tokens live in one `tokens.css`, and total CSS sits around 2 KB. Each component knows exactly what it ships, scaling means dropping a new component next to its styles, and there's nothing to untangle six months from now.

The full rationale and the alternatives I rejected for each one live in [the technical decisions block](https://jcocano.github.io/cv/the-system/#block-technical-decisions).

## How I work

I write code the same way I'd want to inherit it: typed, tested where it pays, and explained well enough that the next person can pick up where I left off. The principles I lean on day to day are written down in [Principles](https://jcocano.github.io/cv/the-system/#block-principles).

## Run locally

```bash
npm ci
npm run dev      # local dev server at http://localhost:4321
npm run build    # static site to ./dist
npm test         # Vitest: unit + render tests
```

Visual baselines (Playwright) are regenerated inside Docker. See [`docs/verification.md`](docs/verification.md) for the canonical command.

## Stack

- **Astro 6**: static site generator
- **TypeScript 5** (strict, no `any`)
- **Vitest 4**: unit + render tests via `experimental_AstroContainer`
- **Playwright 1.59**: visual baselines, byte-exact in Docker
- **Zod 4**: schema validation for bilingual content
- **Plain CSS Modules**: no Tailwind, no preprocessor
- **GitHub Pages**: static deploy via GitHub Actions

## License

MIT. See [LICENSE](LICENSE).
