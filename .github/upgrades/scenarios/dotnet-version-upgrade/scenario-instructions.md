# .NET Version Upgrade

## Preferences
- **Flow Mode**: Automatic
- **Target Framework**: net10.0
- **SDK**: Use installed SDK 10.0.403 (bundles runtime 10.0.14); no global.json added

## Source Control
- **Source Branch**: main
- **Working Branch**: upgrade-dotnet-10
- **Commit Strategy**: Single Commit at End
- **Branch Sync**: Auto (Merge)

## Upgrade Options

### Strategy
- Upgrade Strategy: All-at-Once

## Strategy
**Selected**: All-at-Once
**Rationale**: 2 SDK-style projects on net8.0, zero API incompatibilities, 1 deprecated test package — a mechanical TFM bump.

### Execution Constraints
- Single atomic upgrade: update both project TFMs and test package versions together, then restore
- Build the full solution and fix all compilation errors/warnings in one bounded pass
- Testing (`dotnet test TestProject.sln`) runs after the atomic upgrade builds cleanly
- No tier ordering or multi-targeting

## User Preferences
### Technical Preferences
- Update test packages (Microsoft.NET.Test.Sdk, xunit, xunit.runner.visualstudio) to latest stable compatible with net10.0
- Update README.md prerequisites from .NET 8 to .NET 10 (intro line and winget command)
- Do NOT modify .github/copilot-instructions.md

### Execution Style
- Verification: stop any running TestProject process, then `dotnet test TestProject.sln` (expect 5 passing tests; one shells out to node)
- After verification: merge working branch into main, commit with descriptive message, and `git push` to origin
