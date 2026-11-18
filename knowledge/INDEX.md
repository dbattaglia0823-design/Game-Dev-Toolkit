# Knowledge index

Read this **small routing page first**, then open only what the current task needs. The toolkit's working implementations stay in `godot/`, `web/` and `sound-bank/`; their authoritative module documentation stays in `docs/`.

| Need | Read | Then |
|---|---|---|
| Decide what belongs in shared versus game memory | [Documentation standard](standards/documentation.md) | Target game's `docs/INDEX.md` |
| Keep prompts and context small | [Context budget](standards/context-budget.md) | Relevant file(s) only |
| Godot 4 scenes, physics, UI, import and runtime | [Godot conventions](standards/godot.md) | Toolkit `docs/MODULES.md`, target repo |
| Web game or toolkit UI changes | [Web conventions](standards/web.md) | Toolkit `docs/VALIDATION.md` |
| Implement, validate and document work | [Task lifecycle](workflows/task-lifecycle.md) | [Verification gates](workflows/verification.md) |
| Review third-party vaults and skills | [External references](references/external-projects.md) | Verify current license and code |
| Why this architecture was chosen | [ADR-0001](decisions/ADR-0001-hybrid-knowledge.md) | — |

## Sources of truth, in order

1. Current game repository code, tests and configured engine/toolchain.
2. Game-local `docs/` and `AGENTS.md`, checked against the code.
3. Toolkit modules and their versioned documentation.
4. This shared knowledge vault.
5. External articles or community skill repositories (untrusted until reviewed).

Do not interpret an old note, skill or assistant transcript as proof that an implementation exists.

## Agent usage

- For a **toolkit module** change, begin with `docs/MODULES.md` and its adjacent test docs, not this entire vault.
- For a **game** change, first read that game's `AGENTS.md` and `docs/INDEX.md`. Use this vault only for reusable techniques.
- Discover relevant skills from `.agents/skills/`; use one or two per task, not all of them.
- End with a concise handoff documenting changed paths, tests actually executed, limitations and outstanding work.

## Contributing

Small, linked Markdown pages with verified examples are preferred over long summaries of chats. Follow the [documentation standard](standards/documentation.md). Use relative Markdown links inside the vault so both GitHub and Obsidian can browse them.
