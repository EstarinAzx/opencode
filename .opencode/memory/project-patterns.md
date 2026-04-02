# Project Patterns

## Architecture
- This is a TypeScript monorepo using Bun as the runtime
- Uses the Effect library for functional error handling
- Agent system supports custom agents via `.opencode/agents/*.md` files

## Custom Agents (CC Leak ports)
- **coordinator** — orchestrator mode, delegates to workers, never touches code
- **verification** — adversarial testing agent, produces PASS/FAIL/PARTIAL verdicts

## Memory System
- Memory files live in `.opencode/memory/`
- Scratchpad for cross-agent communication at `.opencode/scratchpad/<sessionID>/`
- Run `/dream` to consolidate memories
