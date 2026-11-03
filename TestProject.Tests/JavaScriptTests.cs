using System.Diagnostics;
using Xunit;

namespace TestProject.Tests;

public sealed class JavaScriptTests
{
    [Fact]
    public async Task AppJs_UnitTests_Pass()
    {
        var testProjectDir = FindTestProjectDirectory();
        var jsTestFile = Path.Combine(testProjectDir, "js", "app.test.js");

        Assert.True(File.Exists(jsTestFile), $"JavaScript test file not found at {jsTestFile}");

        var startInfo = new ProcessStartInfo
        {
            FileName = "node",
            Arguments = $"--test \"{jsTestFile}\"",
            WorkingDirectory = testProjectDir,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(startInfo);
        Assert.NotNull(process);

        var stdOut = await process.StandardOutput.ReadToEndAsync();
        var stdErr = await process.StandardError.ReadToEndAsync();
        await process.WaitForExitAsync();

        Assert.True(
            process.ExitCode == 0,
            $"JavaScript tests failed (exit code {process.ExitCode}).{Environment.NewLine}STDOUT:{Environment.NewLine}{stdOut}{Environment.NewLine}STDERR:{Environment.NewLine}{stdErr}");
    }

    private static string FindTestProjectDirectory()
    {
        var current = new DirectoryInfo(AppContext.BaseDirectory);
        while (current is not null)
        {
            var candidate = Path.Combine(current.FullName, "TestProject.Tests");
            if (Directory.Exists(candidate) && File.Exists(Path.Combine(candidate, "js", "app.test.js")))
            {
                return candidate;
            }

            if (File.Exists(Path.Combine(current.FullName, "js", "app.test.js")))
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        throw new DirectoryNotFoundException("Could not locate TestProject.Tests directory.");
    }
}
