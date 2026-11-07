# Integration workflow

1. **Choose:** identify runtime/version and read `MODULES.md`.
2. **Snapshot:** create a branch and back up saves or data schemas.
3. **Import:** copy one module or pin a release/tag. Don't blindly overwrite an existing implementation.
4. **Adapt:** keep public APIs, scene paths, and persistence keys stable; add adapter code if needed.
5. **Verify:** run module tests, then test in the actual game, including mobile controls and saved-game upgrades.
6. **Record:** note which toolkit version you imported in your game's README.

For a new game, begin with the respective demo and delete the demo-specific content rather than copying unrelated mechanics. For existing games, import selectively.

## GitHub approaches

- **New game:** create a separate starter project and mark it as a template in GitHub repository settings.
- **Existing game:** cherry-pick or copy specific files (simplest), or configure Git subtree/submodule when controlled updates are necessary.
- **Reusable library:** tag stable releases (e.g. `v0.1.0`); test upgrades in branches.

## Security notes

Do not commit API keys. Browser localStorage is not secure for sensitive data; game saves can be tampered with. Do not use client-side saves as an authority for online purchases or leaderboards.
