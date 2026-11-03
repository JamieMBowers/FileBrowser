# .NET Version Upgrade Plan

## Overview

**Target**: Upgrade TestProject.sln from .NET 8 to .NET 10 (LTS)
**Scope**: Small solution — 2 SDK-style projects (ASP.NET Core minimal API + xUnit tests), ~700 LOC

## Upgrade Options

| Option | Selected | Why |
|--------|----------|-----|
| Upgrade Strategy | All-at-Once | Only 2 SDK-style projects on net8.0 with zero API incompatibilities; a single atomic TFM bump is the simplest path. |

### Selected Strategy
**All-At-Once** — All projects upgraded simultaneously in a single operation.
**Rationale**: 2 projects, all on .NET 8, clear dependency structure (Tests → TestProject).

**Projects (single group):**
- Applications: `TestProject.csproj` (Microsoft.NET.Sdk.Web)
- Tests: `TestProject.Tests\TestProject.Tests.csproj` (xUnit)

## Tasks

### 01-upgrade-to-net10: Upgrade both projects to net10.0 and refresh test packages

Verify the toolchain (SDK 10.0.403 / runtime 10.0.14 are installed; no `global.json` is to be added per user preference), then atomically update `TargetFramework` to `net10.0` in `TestProject.csproj` and `TestProject.Tests\TestProject.Tests.csproj`. In the test project, bump `Microsoft.NET.Test.Sdk` (17.8.0), `xunit` (2.6.6 — flagged deprecated by the assessment), and `xunit.runner.visualstudio` (2.5.6) to the latest stable versions compatible with net10.0, using `get_supported_package_version` to resolve them. The main project has no NuGet references beyond the framework.

The assessment found 0 binary/source-incompatible APIs across 1,093 analyzed, so code changes are expected to be minimal. Research starting points: `Program.cs` (static files / `MapStaticAssets` vs `UseStaticFiles` behavior in ASP.NET Core 10), `Endpoints/FileBrowserEndpoints.cs` (minimal API changes such as validation/`[FromForm]` defaults), `TestProject.Tests/JavaScriptTests.cs` (shells out to Node — ensure it still locates the test file after the TFM change). Also update `README.md` Prerequisites and intro line from ".NET 8 SDK" / `winget install Microsoft.DotNet.SDK.8` to .NET 10 / `Microsoft.DotNet.SDK.10`. Do not modify `.github/copilot-instructions.md`.

**Done when**: Both projects target `net10.0`; test packages are on latest stable net10.0-compatible versions; `dotnet build TestProject.sln` succeeds with 0 errors and 0 warnings; README references .NET 10.

---

### 02-validate-and-publish: Run the full test suite and publish the upgrade to origin/main

Stop any running `TestProject` process (it may hold build outputs locked), then run `dotnet test TestProject.sln` — the expected baseline is 5 passing tests, one of which invokes Node to run `TestProject.Tests/js/app.test.js`. Investigate and fix any failures that are attributable to the upgrade. Once green, commit all changes on `upgrade-dotnet-10` with a descriptive message, merge the working branch into `main`, and `git push` to `origin` (https://github.com/JamieMBowers/FileBrowser).

**Done when**: `dotnet test TestProject.sln` reports 5/5 passed on net10.0; changes are committed, merged into `main`, and pushed to `origin/main`.
