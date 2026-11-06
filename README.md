# File & Directory Browser

an ASP.NET Core (.NET 10) minimal Web API

No server-side HTML rendering, no UI frameworks, no front-end build step.

## Prerequisites

| Tool | Required for | Install |
|---|---|---|
| [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) | Building and running the app and C# tests | `winget install Microsoft.DotNet.SDK.10` or download from the link |
| [Node.js](https://nodejs.org/) 18 or newer | Running the JavaScript unit tests only (uses the built-in `node:test` runner, no npm packages) | `winget install OpenJS.NodeJS.LTS` or download from the link |

The web app itself does **not** need Node.js; it is plain JavaScript served as static files. Node is only needed if you want `dotnet test` to run the JS tests.

Optional IDEs: Visual Studio 2022 or newer, JetBrains Rider, or VS Code with the C# Dev Kit extension. The command line alone is sufficient.

Verify your installs:

```powershell
dotnet --version   # should print 10.x
node --version     # should print v18 or newer
```

## Getting started

```powershell
git clone <this-repo-url>
cd TestProject
dotnet run
```

Then open the URL printed in the console (by default **http://localhost:5078**) and click **Open File Browser**.

### Visual Studio / Rider

Open `TestProject.sln` (not the folder) and press F5. Opening the `.sln` is what makes Test Explorer discover the tests.

## Configuration

The directory exposed by the browser is set in `appsettings.json`:

```json
"FileBrowser": {
  "RootPath": "SampleData"
}
```

Relative paths are resolved against the project directory. You can also override it with an environment variable, which takes precedence:

```powershell
$env:FILE_BROWSER_ROOT = "C:\some\folder"
dotnet run
```

The repository ships with a small `SampleData` folder so the app works out of the box. All API operations are confined to the configured root; path traversal outside of it is rejected.

## Running the tests

A single command runs both the C# (xUnit) and JavaScript (`node:test`) suites:

```powershell
dotnet test TestProject.sln
```

The JavaScript tests are launched from within the xUnit project (`TestProject.Tests/JavaScriptTests.cs`), so they also appear in Visual Studio's Test Explorer. If `node` is not on your `PATH`, that one test will fail and the rest will still run.

## Project layout

```
Program.cs                          Composition root: config, DI, middleware (~30 lines)
Endpoints/FileBrowserEndpoints.cs   Minimal API route group and error-to-HTTP mapping
Services/FileBrowserService.cs      All filesystem logic (browse, search, upload, download, delete, move, copy)
Models/FileBrowserModels.cs         JSON DTOs
ContentRootLocator.cs               Finds the project folder so wwwroot works from IDE or bin output
wwwroot/index.html                  Static shell, trigger button, and dialog
wwwroot/app.js                      The SPA: URL state, rendering, dialogs, API calls
SampleData/                         Default browsable root
TestProject.Tests/                  xUnit tests + Node test wrapper
TestProject.Tests/js/               JavaScript unit tests
```

## API

All endpoints return JSON. Paths are relative to the configured root.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/files/browse?path=` | List a folder with file/folder counts and total bytes |
| GET | `/api/files/search?path=&query=` | Recursive name search beneath a folder (capped at 500 results) |
| POST | `/api/files/upload?path=` | Multipart file upload into a folder |
| GET | `/api/files/download?path=` | Download a file |
| DELETE | `/api/files?path=` | Delete a file or folder |
| POST | `/api/files/move` | Move a file or folder |
| POST | `/api/files/copy` | Copy a file or folder |
| GET | `/api/files/root` | Returns the configured root name |

## Deep linking

UI state lives in the URL. `/?path=docs` opens a folder; `/?path=docs&q=report` opens a search. Browser back/forward and reload restore the view.

## Troubleshooting

- **Port already in use** – change `applicationUrl` in `Properties/launchSettings.json` or run `dotnet run --urls http://localhost:5000`.
- **"The process cannot access the file ... apphost.exe"** when building – an instance of the app is still running; stop it first.
- **JavaScript test fails with "node not found"** – install Node.js and restart your terminal/IDE so the updated `PATH` is picked up.
