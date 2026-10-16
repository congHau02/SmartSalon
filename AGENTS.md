# Agent Instructions

## General Workflow & Skill Usage

- **Always consult available skills**: Before executing a task, designing a feature, or solving a problem, always check and reference relevant skills if available. Follow their defined workflows and rules strictly.
- **Frontend & UI/UX Development**: Whenever building frontend components, designing UI/UX, or coding user interfaces, you MUST use and follow the `ui-ux-pro-max` skill (`.agents/skills/ui-ux-pro-max/SKILL.md`).

## Agent skills

### Issue tracker

Local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage roles (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`GLOSSARY.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.
