import { defineConfig } from "vitepress";

export default defineConfig({
  title: "MCP Dataverse",
  description:
    "An MCP server that gives AI agents the real Dataverse schema and 100 tools to act on it. Works with VS Code, Claude, Cursor and more.",
  base: "/mcp-dataverse/",

  appearance: 'dark',
  ignoreDeadLinks: true,
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ["webmcp/**", "webmcp.backup-premerge/**", "_drafts/**", "node_modules/**"],
  sitemap: { hostname: "https://codeurali.github.io/mcp-dataverse/" },

  transformHead({ pageData }) {
    const site = "https://codeurali.github.io/mcp-dataverse/";
    const path = pageData.relativePath.replace(/(^|\/)index\.md$/, "$1").replace(/\.md$/, "");
    const url = site + path;
    const title = pageData.frontmatter.title ?? pageData.title ?? "MCP Dataverse";
    const description =
      pageData.frontmatter.description ?? pageData.description ?? "";
    const head: [string, Record<string, string>][] = [
      ["link", { rel: "canonical", href: url }],
      ["meta", { property: "og:type", content: "website" }],
      ["meta", { property: "og:site_name", content: "MCP Dataverse" }],
      ["meta", { property: "og:url", content: url }],
      ["meta", { property: "og:title", content: title }],
      ["meta", { property: "og:description", content: description }],
      ["meta", { property: "og:image", content: site + "og.png" }],
      ["meta", { name: "twitter:title", content: title }],
      ["meta", { name: "twitter:description", content: description }],
      ["meta", { name: "twitter:image", content: site + "og.png" }],
    ];
    return head;
  },

  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&family=JetBrains+Mono:wght@400;500&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&display=swap",
      },
    ],
    ["link", { rel: "icon", href: "/mcp-dataverse/favicon.svg", type: "image/svg+xml" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    [
      "script",
      { type: "application/ld+json" },
      JSON.stringify({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "MCP Dataverse",
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Windows, macOS, Linux (Node.js 20+)",
        description:
          "An MCP server that gives AI agents the real Microsoft Dataverse schema and 100 tools to act on it.",
        url: "https://codeurali.github.io/mcp-dataverse/",
        codeRepository: "https://github.com/codeurali/mcp-dataverse",
        license: "https://opensource.org/licenses/MIT",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        author: { "@type": "Person", name: "Ali Taggaz" },
      }),
    ],
  ],

  themeConfig: {
    siteTitle: "MCP Dataverse",

    nav: [
      { text: "Getting Started", link: "/getting-started" },
      { text: "Capabilities", link: "/capabilities" },
      { text: "Security", link: "/security" },
      { text: "About", link: "/about" },
      {
        text: "Docs",
        items: [
          { text: "Authentication", link: "/authentication/" },
          { text: "Multi-Client Setup", link: "/multi-client-setup" },
          { text: "Use Cases", link: "/use-cases/" },
          { text: "Roadmap", link: "/roadmap" },
        ],
      },
      { text: "Community", link: "/community" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        collapsed: false,
        items: [{ text: "Installation & Setup", link: "/getting-started" }],
      },
      {
        text: "Authentication",
        collapsed: true,
        items: [
          { text: "Overview", link: "/authentication/" },
          { text: "Local (Interactive)", link: "/authentication/local" },
          {
            text: "Service Principal",
            link: "/authentication/service-principal",
          },
          { text: "Hosted / Managed Identity", link: "/authentication/hosted" },
        ],
      },
      {
        text: "Use Cases",
        collapsed: true,
        items: [
          { text: "Overview", link: "/use-cases/" },
          { text: "Querying Data", link: "/use-cases/querying-data" },
          { text: "Managing Records", link: "/use-cases/managing-records" },
          { text: "Inspecting Schema", link: "/use-cases/inspecting-schema" },
          { text: "Delta Sync", link: "/use-cases/delta-sync" },
          {
            text: "Customizations",
            link: "/use-cases/solutions-and-customizations",
          },
        ],
      },
      {
        text: "Security",
        collapsed: false,
        items: [{ text: "Security and guardrails", link: "/security" }],
      },
      {
        text: "Multi-Client Setup",
        collapsed: true,
        items: [{ text: "Multi-Client Setup", link: "/multi-client-setup" }],
      },
      {
        text: "Reference",
        collapsed: true,
        items: [
          { text: "All Capabilities", link: "/capabilities" },
          { text: "About and architecture", link: "/about" },
          { text: "Roadmap", link: "/roadmap" },
          { text: "Issues & Support", link: "/issues" },
          { text: "Community", link: "/community" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/codeurali/mcp-dataverse" },
      {
        icon: {
          svg: '<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>npm</title><path d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"/></svg>',
        },
        link: "https://www.npmjs.com/package/mcp-dataverse",
      },
    ],

    editLink: {
      pattern:
        "https://github.com/codeurali/mcp-dataverse/edit/master/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      copyright:
        'Copyright © 2026 <a href="https://www.linkedin.com/in/alitaggaz/">Ali Taggaz</a>',
    },
  },

  markdown: {
    lineNumbers: true,
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },
});
