---
title: Community
description: Contribute to MCP Dataverse — bug reports, feature requests, discussions, and sponsorship.
---

# Community

MCP Dataverse is MIT-licensed, published on npm, and actively maintained. The project is built in the open, and bug reports, test results and pull requests are what shape it.

---

## Call for Testers
We need you!
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

Active testers who report bugs or contribute fixes will be credited in the [Changelog](https://github.com/codeurali/mcp-dataverse/blob/master/CHANGELOG.md) and project README.

---

## Found a Bug?

[Open an issue](https://github.com/codeurali/mcp-dataverse/issues) with:
- Tool name and version (from `npm ls mcp-dataverse`, or the `/health` response in HTTP mode)
- Input JSON you sent
- Expected vs. actual output
- Dataverse environment region
