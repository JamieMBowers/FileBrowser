# 02-validate-and-publish: Run the full test suite and publish the upgrade to origin/main

Stop any running `TestProject` process (it may hold build outputs locked), then run `dotnet test TestProject.sln` — the expected baseline is 5 passing tests, one of which invokes Node to run `TestProject.Tests/js/app.test.js`. Investigate and fix any failures that are attributable to the upgrade. Once green, commit all changes on `upgrade-dotnet-10` with a descriptive message, merge the working branch into `main`, and `git push` to `origin` (https://github.com/JamieMBowers/FileBrowser).

**Done when**: `dotnet test TestProject.sln` reports 5/5 passed on net10.0; changes are committed, merged into `main`, and pushed to `origin/main`.
