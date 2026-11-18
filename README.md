# Portfolio

The source of my personal site, live at <https://dylanwollet.netlify.app>.

It is one page where scrolling changes altitude: sea level, down to the abyss, back to the surface
and out to orbit. Along the way are four small engineering tools that run in the page.

## How this was built

This is my site, built by directing AI coding agents. I chose the concept and the content, and the
facts on the page come from my resume. AI agents wrote the code and the tests from a written design
spec, and the checks below have to pass before anything is deployed.

This repository is a snapshot of the current site. The working history, plans and notes are kept
privately.

## Stack

Astro (static, one route) and TypeScript. Lenis for wheel inertia on desktop. No backend.

- All copy and facts live in `src/content/site.ts`.
- Colour lives in `src/lib/palette.ts`. A unit test fails if text loses AA contrast.
- The tool maths lives in `src/lib/` with no DOM code and a test beside each file. The drawings in
  `src/lib/views/` are pure functions used both at build time and in the browser, so the page
  works without JavaScript.
- The tools are labeled as tools. Their inputs are not measurements of anything I built.

## Run it

Requires Node.js.

```sh
npm install
npm run dev        # local site
npm run check      # astro check
npm test           # unit tests (Vitest)
npm run build      # outputs dist/
npm run e2e        # Playwright, desktop and phone (needs: npx playwright install chromium)
npm run budget     # JavaScript size budget, 60 KB gzipped
```

## Credits

Fonts are installed through Fontsource under the SIL Open Font License. All imagery is drawn in
code.

## License

No license is granted. The code and the content are published to be read; all rights are reserved.
