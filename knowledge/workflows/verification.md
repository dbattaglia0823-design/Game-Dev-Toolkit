# Verification gates and truthful reporting

Start by checking what the target repo **actually** provides: CI workflows, test commands, engine version, tools available in the environment and expected artifacts.

| Change type | Minimum recommended evidence |
|---|---|
| Documentation, templates or agent skills | Link/path checks, template generation tests, correct relative references, workflow syntax |
| Toolkit browser logic | `cd web && npm test`; browser smoke for changes in rendered behavior |
| Toolkit Godot adapter | Import/parse and dedicated Godot tests as described in `docs/VALIDATION.md` |
| Game physics, AI or racing systems | Compile/parse + relevant automated tests + deterministic simulated cases + live gameplay check |
| UI, sprites, responsive HUD or audio | Source tests plus manual screen/device or playback verification where available |
| Save, progression, currency, destructive cleanup | Migration tests, backups, compatibility fixtures and explicit review |

## Handoff format

- **Changed:** exact paths and behavior.
- **Verified:** commands/tests that completed and their results.
- **Not verified:** tools missing, platforms unavailable, manual checks outstanding.
- **Risks:** compatibility, migration, licenses or performance.
- **Next:** smallest follow-up needed.

A pass on one job is not a pass on all GitHub checks. When CI is still running, report pending instead of assuming success. Keep test outputs linked or summarized rather than pasted into an index page.
