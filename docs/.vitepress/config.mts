import { defineConfig } from "vitepress";

export default defineConfig({
  title: "MCP Dataverse",
  description:
    "The most complete MCP server for Microsoft Dataverse — 79 tools, multi-mode auth, works with VS Code, Claude, Cursor & more.",
  base: "/mcp-dataverse/",

  appearance: true,
  ignoreDeadLinks: true,

  head: [
    ["link", { rel: "icon", href: "/mcp-dataverse/logo.webp" }],
    ["meta", { name: "og:title", content: "MCP Dataverse" }],
    [
      "meta",
      {
        name: "og:description",
        content: "The most complete MCP server for Microsoft Dataverse",
      },
    ],
    [
      "meta",
      {
        name: "og:image",
        content: "https://codeurali.github.io/mcp-dataverse/logo.webp",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],

  themeConfig: {
    siteTitle: "MCP Dataverse",

    nav: [
      { text: "Home", link: "/" },
      { text: "Getting Started", link: "/getting-started" },
      { text: "Capabilities", link: "/capabilities" },
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
            text: "Solutions & Customizations",
            link: "/use-cases/solutions-and-customizations",
          },
        ],
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

    search: {
      provider: "local",
    },

    footer: {
      copyright:
        'Copyright © 2026 <a href="https://www.linkedin.com/in/alitaggaz/">Ali Taggaz</a>',
    },
  },

  markdown: {
    lineNumbers: true,
  },
});
