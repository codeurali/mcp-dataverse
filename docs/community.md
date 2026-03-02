---
layout: default
title: Community
nav_order: 7
permalink: /community
---

# Community

MCP Dataverse is open-source (MIT) and actively maintained. We're building the most complete MCP server for Microsoft Dataverse — and we need your help to make it better.

---

## Call for Testers
{: .d-inline-block }

We need you!
{: .label .label-green }

We're looking for developers and Power Platform professionals to test MCP Dataverse in their own environments. Different Dataverse configurations, org sizes, and use cases help us find edge cases we can't reproduce on our test environment.

### How to Participate

1. **Install MCP Dataverse** in your environment:
   ```bash
   npx mcp-dataverse install
   ```

2. **Try the tools** that matter to your workflow — schema inspection, querying, CRUD, solutions, whatever you use daily.

3. **Report what you find**:
   - [Open an issue](https://github.com/codeurali/mcp-dataverse/issues) for bugs or unexpected behavior
   - Include the tool name, input, and error message (or unexpected output)
   - Mention your Dataverse region (CRM1, CRM4, CRM12…) — some behaviors are region-specific

### What We're Especially Interested In

| Area | Why |
|:-----|:----|
| **Large environments** | 100+ custom tables, thousands of records — performance and pagination edge cases |
| **GCC / GCC High** | Government cloud configurations with different auth endpoints |
| **Multi-language orgs** | Localized label handling, option set translations |
| **Heavy plugin environments** | Complex plugin chains, async patterns, trace log volume |
| **Dynamics 365 modules** | Sales, Service, Marketing — module-specific entities and actions |

### Tester Recognition

Active testers who report bugs or contribute fixes will be credited in the [Changelog]({{ site.baseurl }}/changelog) and project README.

---

## Contributing

### Report Bugs

[Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with:
- Tool name and version (`mcp-dataverse --version`)
- Input JSON you sent
- Expected vs. actual output
- Dataverse environment region

### Suggest Features

Use the `enhancement` label when [opening an issue](https://github.com/codeurali/mcp-dataverse/issues). Check the [Roadmap]({{ site.baseurl }}/roadmap) first — your idea might already be planned.

### Code Contributions

1. Fork the repository
2. Create a feature branch
3. Run tests: `npm test`
4. Submit a pull request

The project uses TypeScript strict mode, Zod validation, and structured outputs. See [CAPABILITIES.md](https://github.com/codeurali/mcp-dataverse/blob/master/CAPABILITIES.md) for the full API surface.

---

## Links

- [npm package](https://www.npmjs.com/package/mcp-dataverse)
- [GitHub repository](https://github.com/codeurali/mcp-dataverse)
- [MCP Registry](https://github.com/modelcontextprotocol/servers)
- [Smithery](https://smithery.ai/server/@codeurali/mcp-dataverse)
