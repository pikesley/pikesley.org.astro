import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import yaml from "@rollup/plugin-yaml";

// https://astro.build/config
import htmlBeautifier from "astro-html-beautifier";

// https://astro.build/config
export default defineConfig({
  site: "https://sam.pikesley.org",
  integrations: [
    mdx(),
    sitemap(),
    htmlBeautifier({
      indent_size: 2,
      wrap_line_length: 88,
      jslint_happy: true,
      preserve_newlines: false,
    }),
  ],
  vite: {
    plugins: [yaml()],
  },
});
