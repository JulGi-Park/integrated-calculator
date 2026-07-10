# Codex Workspace Rules

## Device Sync

- At the start of work, check the current branch, local HEAD, `origin` HEAD, and working tree status before making changes.
- When the user asks to finish work or switch devices, use `backup-work.cmd` from the repository root.
- When resuming on another PC, use `restore-work.cmd <branch>`, for example `restore-work.cmd release/vat-profit-260710`.
- Do not run checkout, reset, clean, or pull while there are uncommitted changes unless the approved restore script has first backed them up.
- Do not use `stash` as a cross-device backup mechanism.
- Do not sync `node_modules`, `.next`, `out`, or real `.env` files.
- If automatic backup or restore fails, do not bypass it with destructive manual commands. Stop and report the exact failure.
- Never use `reset --hard`, `clean -fd`, rebase, force push, or stash to solve cross-device synchronization.
