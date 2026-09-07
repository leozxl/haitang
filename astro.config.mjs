import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import AutoImport from "astro-auto-import";
import { defineConfig } from "astro/config";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import config from "./src/config/config.json";
import icon from "astro-icon";
import partytown from "@astrojs/partytown";

import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: vercel(),
  site: config.site.base_url,
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",
  integrations: [react(), tailwind({
    config: {
      applyBaseStyles: false
    }
  }), AutoImport({
    imports: []
  }), mdx(), icon({
    include: {
      tabler: ['*']
    }
  }), partytown({
    config: {
      debug: true,
      forward: ['dataLayer.push']
    }
  })
  // solidJs()
  ],
  markdown: {
    remarkPlugins: [remarkToc, [remarkCollapse, {
      test: "Table of contents"
    }]],
    shikiConfig: {
      theme: "one-dark-pro",
      wrap: true
    },
    extendDefaultPlugins: true
  }
});
