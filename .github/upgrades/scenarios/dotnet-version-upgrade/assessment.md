# Projects and dependencies analysis

This document provides a comprehensive overview of the projects and their dependencies in the context of upgrading to .NETCoreApp,Version=v10.0.

## Table of Contents

- [Executive Summary](#executive-Summary)
  - [Highlevel Metrics](#highlevel-metrics)
  - [Projects Compatibility](#projects-compatibility)
  - [Package Compatibility](#package-compatibility)
  - [API Compatibility](#api-compatibility)
  - [Binding Redirect Configuration](#binding-redirect-configuration)
- [Aggregate NuGet packages details](#aggregate-nuget-packages-details)
- [Top API Migration Challenges](#top-api-migration-challenges)
  - [Technologies and Features](#technologies-and-features)
  - [Most Frequent API Issues](#most-frequent-api-issues)
- [Projects Relationship Graph](#projects-relationship-graph)
- [Project Details](#project-details)

  - [TestProject.csproj](#testprojectcsproj)
  - [TestProject.Tests\TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj)


## Executive Summary

### Highlevel Metrics

| Metric | Count | Status |
| :--- | :---: | :--- |
| Total Projects | 2 | All require upgrade |
| Total NuGet Packages | 15 | 1 need upgrade |
| Total Code Files | 7 |  |
| Total Code Files with Incidents | 2 |  |
| Total Lines of Code | 696 |  |
| Total Number of Issues | 3 |  |
| Estimated LOC to modify | 0+ | at least 0.0% of codebase |

### Projects Compatibility

| Project | Target Framework | Difficulty | Package Issues | API Issues | Binding Issues | Est. LOC Impact | Description |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| [TestProject.csproj](#testprojectcsproj) | net8.0 | 🟢 Low | 0 | 0 | 0 |  | AspNetCore, Sdk Style = True |
| [TestProject.Tests\TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | net8.0 | 🟢 Low | 1 | 0 | 0 |  | DotNetCoreApp, Sdk Style = True |

### Package Compatibility

| Status | Count | Percentage |
| :--- | :---: | :---: |
| ✅ Compatible | 14 | 93.3% |
| ⚠️ Incompatible | 1 | 6.7% |
| 🔄 Upgrade Recommended | 0 | 0.0% |
| ***Total NuGet Packages*** | ***15*** | ***100%*** |

### API Compatibility

| Category | Count | Impact |
| :--- | :---: | :--- |
| 🔴 Binary Incompatible | 0 | High - Require code changes |
| 🟡 Source Incompatible | 0 | Medium - Needs re-compilation and potential conflicting API error fixing |
| 🔵 Behavioral change | 0 | Low - Behavioral changes that may require testing at runtime |
| ✅ Compatible | 1093 |  |
| ***Total APIs Analyzed*** | ***1093*** |  |

## Aggregate NuGet packages details

| Package | Current Version | Suggested Version | Projects | Description |
| :--- | :---: | :---: | :--- | :--- |
| Microsoft.CodeCoverage | 17.8.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| Microsoft.NET.Test.Sdk | 17.8.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| Microsoft.TestPlatform.ObjectModel | 17.8.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| Microsoft.TestPlatform.TestHost | 17.8.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| Newtonsoft.Json | 13.0.1 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| NuGet.Frameworks | 6.5.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| System.Reflection.Metadata | 1.6.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit | 2.6.6 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ⚠️NuGet package is deprecated |
| xunit.abstractions | 2.0.3 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit.analyzers | 1.10.0 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit.assert | 2.6.6 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit.core | 2.6.6 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit.extensibility.core | 2.6.6 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit.extensibility.execution | 2.6.6 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |
| xunit.runner.visualstudio | 2.5.6 |  | [TestProject.Tests.csproj](#testprojectteststestprojecttestscsproj) | ✅Compatible |

## Top API Migration Challenges

### Technologies and Features

| Technology | Issues | Percentage | Migration Path |
| :--- | :---: | :---: | :--- |

### Most Frequent API Issues

| API | Count | Percentage | Category |
| :--- | :---: | :---: | :--- |

## Projects Relationship Graph

Legend:
📦 SDK-style project
⚙️ Classic project

```mermaid
flowchart LR
    P1["<b>📦&nbsp;TestProject.csproj</b><br/><small>net8.0</small>"]
    P2["<b>📦&nbsp;TestProject.Tests.csproj</b><br/><small>net8.0</small>"]
    P2 --> P1
    click P1 "#testprojectcsproj"
    click P2 "#testprojectteststestprojecttestscsproj"

```

## Project Details

<a id="testprojectcsproj"></a>
### TestProject.csproj

#### Project Info

- **Current Target Framework:** net8.0
- **Proposed Target Framework:** net10.0
- **SDK-style**: True
- **Project Kind:** AspNetCore
- **Dependencies**: 0
- **Dependants**: 1
- **Number of Files**: 9
- **Number of Files with Incidents**: 1
- **Lines of Code**: 558
- **Estimated LOC to modify**: 0+ (at least 0.0% of the project)

#### Dependency Graph

Legend:
📦 SDK-style project
⚙️ Classic project

```mermaid
flowchart TB
    subgraph upstream["Dependants (1)"]
        P2["<b>📦&nbsp;TestProject.Tests.csproj</b><br/><small>net8.0</small>"]
        click P2 "#testprojectteststestprojecttestscsproj"
    end
    subgraph current["TestProject.csproj"]
        MAIN["<b>📦&nbsp;TestProject.csproj</b><br/><small>net8.0</small>"]
        click MAIN "#testprojectcsproj"
    end
    P2 --> MAIN

```

### API Compatibility

| Category | Count | Impact |
| :--- | :---: | :--- |
| 🔴 Binary Incompatible | 0 | High - Require code changes |
| 🟡 Source Incompatible | 0 | Medium - Needs re-compilation and potential conflicting API error fixing |
| 🔵 Behavioral change | 0 | Low - Behavioral changes that may require testing at runtime |
| ✅ Compatible | 793 |  |
| ***Total APIs Analyzed*** | ***793*** |  |

<a id="testprojectteststestprojecttestscsproj"></a>
### TestProject.Tests\TestProject.Tests.csproj

#### Project Info

- **Current Target Framework:** net8.0
- **Proposed Target Framework:** net10.0
- **SDK-style**: True
- **Project Kind:** DotNetCoreApp
- **Dependencies**: 1
- **Dependants**: 0
- **Number of Files**: 4
- **Number of Files with Incidents**: 1
- **Lines of Code**: 138
- **Estimated LOC to modify**: 0+ (at least 0.0% of the project)

#### Dependency Graph

Legend:
📦 SDK-style project
⚙️ Classic project

```mermaid
flowchart TB
    subgraph current["TestProject.Tests.csproj"]
        MAIN["<b>📦&nbsp;TestProject.Tests.csproj</b><br/><small>net8.0</small>"]
        click MAIN "#testprojectteststestprojecttestscsproj"
    end
    subgraph downstream["Dependencies (1"]
        P1["<b>📦&nbsp;TestProject.csproj</b><br/><small>net8.0</small>"]
        click P1 "#testprojectcsproj"
    end
    MAIN --> P1

```

### API Compatibility

| Category | Count | Impact |
| :--- | :---: | :--- |
| 🔴 Binary Incompatible | 0 | High - Require code changes |
| 🟡 Source Incompatible | 0 | Medium - Needs re-compilation and potential conflicting API error fixing |
| 🔵 Behavioral change | 0 | Low - Behavioral changes that may require testing at runtime |
| ✅ Compatible | 300 |  |
| ***Total APIs Analyzed*** | ***300*** |  |

