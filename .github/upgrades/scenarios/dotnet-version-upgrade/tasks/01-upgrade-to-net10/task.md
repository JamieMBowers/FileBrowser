# 01-upgrade-to-net10: Upgrade both projects to net10.0 and refresh test packages

Verify the toolchain (SDK 10.0.403 / runtime 10.0.14 are installed; no `global.json` is to be added per user preference), then atomically update `TargetFramework` to `net10.0` in `TestProject.csproj` and `TestProject.Tests\TestProject.Tests.csproj`. In the test project, bump `Microsoft.NET.Test.Sdk` (17.8.0), `xunit` (2.6.6 — flagged deprecated by the assessment), and `xunit.runner.visualstudio` (2.5.6) to the latest stable versions compatible with net10.0, using `get_supported_package_version` to resolve them. The main project has no NuGet references beyond the framework.

The assessment found 0 binary/source-incompatible APIs across 1,093 analyzed, so code changes are expected to be minimal. Research starting points: `Program.cs` (static files / `MapStaticAssets` vs `UseStaticFiles` behavior in ASP.NET Core 10), `Endpoints/FileBrowserEndpoints.cs` (minimal API changes such as validation/`[FromForm]` defaults), `TestProject.Tests/JavaScriptTests.cs` (shells out to Node — ensure it still locates the test file after the TFM change). Also update `README.md` Prerequisites and intro line from ".NET 8 SDK" / `winget install Microsoft.DotNet.SDK.8` to .NET 10 / `Microsoft.DotNet.SDK.10`. Do not modify `.github/copilot-instructions.md`.

**Done when**: Both projects target `net10.0`; test packages are on latest stable net10.0-compatible versions; `dotnet build TestProject.sln` succeeds with 0 errors and 0 warnings; README references .NET 10.

## Research Findings

### Toolchain
- `dotnet --list-sdks`: 10.0.403 installed; runtimes Microsoft.NETCore.App / Microsoft.AspNetCore.App 10.0.14 present. No global.json (user preference).

### Project files (no CPM, no Directory.Build.props — all versions inline)
- `TestProject.csproj`: `Microsoft.NET.Sdk.Web`, `<TargetFramework>net8.0</TargetFramework>`, Nullable/ImplicitUsings enabled, no PackageReferences. Note: contains stray `<None Include=".github\upgrades\...">` items auto-added by the IDE — leave as-is (harmless).
- `TestProject.Tests\TestProject.Tests.csproj`: `Microsoft.NET.Sdk`, net8.0, packages Microsoft.NET.Test.Sdk 17.8.0, xunit 2.6.6, xunit.runner.visualstudio 2.5.6 (PrivateAssets=all); ProjectReference to `..\TestProject.csproj`.

### Resolved package versions (get_supported_package_version, net10.0, stable)
| Package | Current | Target |
|---|---|---|
| Microsoft.NET.Test.Sdk | 17.8.0 | 18.11.0 |
| xunit | 2.6.6 | 2.9.3 |
| xunit.runner.visualstudio | 2.5.6 | 4.0.1 |

Staying on xunit v2 line (2.9.3) rather than migrating to xunit.v3 — smallest safe change; tests use `[Fact]`, `Assert.*`, `async Task` only.

### Source review (ASP.NET Core 10 breaking-change check)
- `Program.cs`: `WebApplication.CreateBuilder(WebApplicationOptions)`, `UseStaticFiles()`, `MapFallbackToFile("index.html")` — all still supported in .NET 10; no change needed.
- `Endpoints/FileBrowserEndpoints.cs`: MapGroup/MapGet/MapPost/MapDelete with query string params, `HttpRequest.ReadFormAsync`, JSON body DTO (`MoveCopyRequestDto`), `Results.*` — no affected APIs. No `[FromForm]` / validation attributes in use.
- `TestProject.Tests/JavaScriptTests.cs`: walks up from `AppContext.BaseDirectory` (`bin/Debug/net10.0/`) to find `TestProject.Tests/js/app.test.js` — path depth unchanged by the TFM rename; still works.

### README.md edits
- Line 3: "ASP.NET Core (.NET 8)" → ".NET 10"
- Line 11: `.NET 8 SDK` link `dotnet/8.0` → `.NET 10 SDK` / `dotnet/10.0`; `winget install Microsoft.DotNet.SDK.8` → `Microsoft.DotNet.SDK.10`

### Build approach
- SDK-style, modern TFM only → `dotnet build TestProject.sln` (restore included).

## Execution Plan
1. Edit both csproj TFMs → net10.0
2. Bump 3 test package versions
3. Edit README.md (2 lines)
4. `dotnet build TestProject.sln`; fix any warnings

