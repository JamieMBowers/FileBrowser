namespace TestProject;

/// <summary>
/// Locates the project directory so wwwroot and the sample data are found
/// whether the app is started from the IDE, the project folder, or the build output folder.
/// </summary>
public static class ContentRootLocator
{
    public static string Resolve()
    {
        var candidates = new[]
        {
            Directory.GetCurrentDirectory(),
            AppContext.BaseDirectory
        };

        foreach (var candidate in candidates)
        {
            var projectRoot = FindProjectRoot(candidate);
            if (projectRoot is not null)
            {
                return projectRoot;
            }
        }

        return Directory.GetCurrentDirectory();
    }

    private static string? FindProjectRoot(string startPath)
    {
        var current = new DirectoryInfo(startPath);

        while (current is not null)
        {
            var hasProjectFile = current.EnumerateFiles("*.csproj").Any();
            var hasWebRoot = Directory.Exists(Path.Combine(current.FullName, "wwwroot"));

            if (hasProjectFile && hasWebRoot)
            {
                return current.FullName;
            }

            current = current.Parent;
        }

        return null;
    }
}
