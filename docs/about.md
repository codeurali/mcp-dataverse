---
title: About and architecture
description: The design principles behind MCP Dataverse, the MCP Template it grew from, how AI assistance is used and held to engineering gates, and who maintains it.
---

# About and architecture

MCP Dataverse is maintained by me, [Ali Taggaz](https://www.alitaggaz.com/resume). I am a senior consultant with more than five years of Power Platform, Dynamics 365 and Copilot delivery, and Dataverse is the system I spend most days in. This server exists because I wanted an agent to work against a real environment the way I do: read the schema first, act under a known identity, and report what it did.

This page explains the thinking behind it, because the design choices matter more than the tool count.

---

## MCP did not need to be replaced. It needed structure.

In early 2026 the mood around MCP turned. Benchmarks comparing the GitHub MCP server with the `gh` command line reported far lower token cost for the CLI, with figures between 4x and 32x depending on the task ([summary](https://getunblocked.com/blog/github-mcp-token-cost/)). On 11 March 2026, Perplexity's CTO, Denis Yarats, said the company was moving away from MCP toward APIs and CLIs, citing context-window consumption and authentication friction ([report](https://awesomeagents.ai/news/perplexity-agent-api-mcp-shift/)). Perplexity still runs a public MCP server for developers who want it.

The criticism was fair about what it measured. A server that loads dozens of loosely described tools and returns unbounded payloads is expensive and unreliable, and that was the common state of early MCP servers: no conventions, no output contracts, no consistent safety metadata. The protocol was young, and so was the practice around it.

My conclusion was that the problem was practice, not protocol. Where an agent needs typed access to an existing API, with discovery, validation and a permission boundary, MCP is a reasonable contract, provided the server is built with discipline. That discipline is what I wrote down.

---

## The MCP Template

[MCP Template](https://github.com/codeurali/MCP_Template) is a public, MIT-licensed starter for building MCP servers that stay deterministic, debuggable and agent-friendly. It grew out of building this server and encodes the conventions that survived contact with a large tool surface. I maintain it alongside MCP Dataverse.

It is built around fifteen rules, among them:

- **Atomic tools.** One tool, one action. No hidden orchestration, no smart routers.
- **Structured outputs.** Every result is `{ summary, data, suggestions, warnings }`, delivered as both text and MCP `structuredContent`, with a declared `outputSchema`.
- **Annotations on every tool.** Read-only, destructive, idempotent and open-world hints are required, not optional.
- **Explicit destructive operations.** The riskiest operations require an explicit confirmation parameter.
- **Strict inputs.** Zod validates configuration and tool arguments. Invalid calls come back as tool errors the model can correct from.
- **Bounded outputs.** Small schemas, capped list sizes, paging instead of dumps.

The template also ships three entry points that share one server factory (stdio against an HTTP API, stdio against a local CLI, and Streamable HTTP), and a set of instructions for coding assistants so a new server starts from the same standards.

It targets one case: an MCP server that wraps an existing API or CLI. An MCP server with a different job, such as a memory store or a workflow engine, may not fit it, and it does not try to.

---

## How MCP Dataverse applies it

| Principle | In this server |
| :-------- | :------------- |
| Atomic tools | 81 core tools in 28 categories, each doing one thing. The agent chains them; the server does not route for it. |
| Structured results | Core tools return the `{ summary, data, suggestions, warnings }` envelope with `structuredContent` and a shared `outputSchema`, so clients can consume typed results. |
| Explicit safety | Tools declare read-only and destructive annotations, and the 14 riskiest operations require `confirm: true`. The limits of that protection are spelled out in [Security and guardrails](/security). |
| Validated input | Zod schemas on tool inputs, with safe identifier patterns for table and relationship names. |
| Bounded output | Query caps, paging and a hard ceiling on records per call. |
| One source of truth | The tool registry in `src/tools/tool-modules.ts` is the single catalogue. The server and the documentation counts are generated from it (`npm run docs:sync`), so published numbers come from the registry rather than from memory. |
| Layering | Entry point, server factory, tool registry, tool modules, Dataverse client. Transport wiring is separate from tool logic. |

Calls to Dataverse go through one HTTP client with retry and backoff for throttling and transient errors, and a typed error category (`ENV_LIMITATION`, `PERMISSIONS`, `SCHEMA_MISMATCH`) so an agent can tell a missing privilege from a disabled feature.

---

## Built with AI assistance, held to engineering gates

AI coding assistants are part of how this project is written, and I would rather say so than leave you to wonder. The question that matters to a user is what stands between generated code and a release.

- **Typed and linted.** TypeScript in strict mode, ESLint, and a file-size guard that keeps modules small enough to review.
- **Tested before commit.** A verify step (typecheck, lint, unit tests) runs before changes are accepted, and the suite must stay green. Tests are not weakened to pass.
- **Contracts, not vibes.** Behaviour is pinned by schemas and annotations that tests assert, such as the shape of every tool result.
- **A written history.** Every change lands in a detailed [CHANGELOG](https://github.com/codeurali/mcp-dataverse/blob/master/CHANGELOG.md), including fixes for my own mistakes.
- **A human decides.** Design, scope and release decisions are mine. The agent proposes; I review and ship.

The same approach, human checkpoints around agent work, is what I apply in client delivery, where I proposed an agentic delivery framework that is now standard practice on my team.

---

## What it is not

It is a focused tool for one platform, built by one maintainer. It does not replace Dataverse administration, solution lifecycle management or a security review of your environment. The [roadmap](/roadmap) lists what is shipped and what is planned, and the known [limitations](/issues) are documented.

---

## Links

- [MCP Dataverse on GitHub](https://github.com/codeurali/mcp-dataverse) · [npm](https://www.npmjs.com/package/mcp-dataverse) · [MCP Registry](https://registry.modelcontextprotocol.io/?q=dataverse)
- [MCP Template](https://github.com/codeurali/MCP_Template)
- [Ali Taggaz: resume](https://www.alitaggaz.com/resume) · [LinkedIn](https://www.linkedin.com/in/alitaggaz/)
