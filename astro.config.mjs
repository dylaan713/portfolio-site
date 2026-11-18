import { defineConfig } from 'astro/config';
// Stylesheets are inlined: one route, one stylesheet, and a round trip saved before first paint.
export default defineConfig({ site: 'https://dylanwollet.netlify.app', build: { inlineStylesheets: 'always' } });
