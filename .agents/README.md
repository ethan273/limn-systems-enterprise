# Agent Workflow System for Limn Systems Enterprise

This directory contains templates, workflows, and configurations for using AI agents effectively on this project.

## Quick Start

### 1. Choose Your Agent Type Based on Task

| Task Type | Agent Type | Skills Needed | Start Template |
|-----------|-----------|---------------|----------------|
| Code Generation | Code Agent | File creation, type-checking | `code-agent.md` |
| Bug Fixing | Debug Agent | File reading, search, testing | `debug-agent.md` |
| Database Work | Database Agent | Prisma, SQL, migrations | `database-agent.md` |
| Testing | Test Agent | Playwright, test running | `test-agent.md` |
| Documentation | Docs Agent | File reading, markdown | `docs-agent.md` |
| Cleanup/Refactor | Maintenance Agent | File management, search | `maintenance-agent.md` |

### 2. Start a New Agent Session

When starting a new conversation with Claude (or another AI agent):

```
I'm working on Limn Systems Enterprise. Please read:
- /Users/eko3/limn-systems-enterprise/.agents/PROJECT-CONTEXT.md
- /Users/eko3/limn-systems-enterprise/.agents/[SPECIFIC-AGENT].md

Then help me with: [YOUR TASK]
```

### 3. Use Desktop Commander Skills

Desktop Commander gives agents these capabilities:
- ✅ Read/write files
- ✅ Search codebase
- ✅ Run commands
- ✅ Execute tests
- ✅ Analyze databases

## Available Agent Templates

Each template is optimized for specific tasks with the right context and instructions.

---

## Agent Types Explained

### Code Agent
**When to use:** Creating new features, components, API routes, or modules

**Capabilities:**
- Generate TypeScript/React code following project patterns
- Create tRPC routers
- Build Prisma models
- Write tests alongside code
