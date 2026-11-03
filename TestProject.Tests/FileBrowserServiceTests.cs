using TestProject.Services;
using Xunit;

namespace TestProject.Tests;

public sealed class FileBrowserServiceTests : IDisposable
{
    private readonly string _tempRoot;
    private readonly FileBrowserService _service;

    public FileBrowserServiceTests()
    {
        _tempRoot = Path.Combine(Path.GetTempPath(), "FileBrowserTests_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_tempRoot);
        _service = new FileBrowserService(_tempRoot);
    }

    [Fact]
    public void Browse_ReturnsDirectoriesFilesAndStats()
    {
        Directory.CreateDirectory(Path.Combine(_tempRoot, "docs"));
        File.WriteAllText(Path.Combine(_tempRoot, "readme.txt"), "hello world");

        var response = _service.Browse("");

        Assert.Equal("", response.CurrentPath);
        Assert.Null(response.ParentPath);
        Assert.Equal(1, response.Stats.DirectoryCount);
        Assert.Equal(1, response.Stats.FileCount);
        Assert.Equal(11, response.Stats.TotalFileBytes);
        Assert.Equal(2, response.Entries.Count);
    }

    [Fact]
    public void Search_FindsNestedMatchingFilesAndFolders()
    {
        Directory.CreateDirectory(Path.Combine(_tempRoot, "docs", "sub"));
        File.WriteAllText(Path.Combine(_tempRoot, "docs", "sub", "notes.txt"), "nested text");
        File.WriteAllText(Path.Combine(_tempRoot, "other.txt"), "ignored");

        var response = _service.Search("", "notes");

        Assert.Single(response.Entries);
        Assert.Equal("docs/sub/notes.txt", response.Entries[0].RelativePath);
        Assert.Equal(1, response.Stats.FileCount);
    }

    [Fact]
    public void CopyMoveAndDelete_OperateWithinRoot()
    {
        Directory.CreateDirectory(Path.Combine(_tempRoot, "docs"));
        File.WriteAllText(Path.Combine(_tempRoot, "readme.txt"), "content");

        _service.CopyPath("readme.txt", "docs/readme.txt", overwrite: true);
        Assert.True(File.Exists(Path.Combine(_tempRoot, "docs", "readme.txt")));

        _service.MovePath("docs/readme.txt", "docs/moved.txt", overwrite: true);
        Assert.False(File.Exists(Path.Combine(_tempRoot, "docs", "readme.txt")));
        Assert.True(File.Exists(Path.Combine(_tempRoot, "docs", "moved.txt")));

        _service.DeletePath("docs/moved.txt");
        Assert.False(File.Exists(Path.Combine(_tempRoot, "docs", "moved.txt")));
    }

    [Fact]
    public void GetAbsolutePath_RejectsPathTraversalOutsideRoot()
    {
        Assert.Throws<InvalidOperationException>(() => _service.GetAbsolutePath("../outside.txt"));
    }

    public void Dispose()
    {
        if (Directory.Exists(_tempRoot))
        {
            Directory.Delete(_tempRoot, recursive: true);
        }
    }
}
