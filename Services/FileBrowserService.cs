using TestProject.Models;

namespace TestProject.Services;

public class FileBrowserService
{
    private readonly string _rootPath;

    public FileBrowserService(string rootPath)
    {
        _rootPath = Path.GetFullPath(rootPath);
        Directory.CreateDirectory(_rootPath);
    }

    public string RootPath => _rootPath;

    public string NormalizeRelativePath(string? relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
        {
            return string.Empty;
        }

        return relativePath.Replace('\\', '/').Trim('/');
    }

    public string GetAbsolutePath(string? relativePath)
    {
        var normalized = NormalizeRelativePath(relativePath);
        var absolute = Path.GetFullPath(Path.Combine(_rootPath, normalized));

        if (!absolute.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Path escapes configured root.");
        }

        return absolute;
    }

    public string GetRelativePath(string absolutePath)
    {
        var relative = Path.GetRelativePath(_rootPath, absolutePath);
        if (relative == ".")
        {
            return string.Empty;
        }

        return relative.Replace('\\', '/');
    }

    public BrowseResponseDto Browse(string? relativePath)
    {
        var absolutePath = GetAbsolutePath(relativePath);
        if (!Directory.Exists(absolutePath))
        {
            throw new DirectoryNotFoundException("Directory not found.");
        }

        var directory = new DirectoryInfo(absolutePath);
        var entries = new List<FileSystemEntryDto>();
        var fileCount = 0;
        var directoryCount = 0;
        long totalFileBytes = 0;

        foreach (var childDirectory in directory.GetDirectories().OrderBy(d => d.Name, StringComparer.OrdinalIgnoreCase))
        {
            directoryCount++;
            entries.Add(new FileSystemEntryDto(
                childDirectory.Name,
                GetRelativePath(childDirectory.FullName),
                true,
                0,
                new DateTimeOffset(childDirectory.LastWriteTimeUtc)));
        }

        foreach (var file in directory.GetFiles().OrderBy(f => f.Name, StringComparer.OrdinalIgnoreCase))
        {
            fileCount++;
            totalFileBytes += file.Length;
            entries.Add(new FileSystemEntryDto(
                file.Name,
                GetRelativePath(file.FullName),
                false,
                file.Length,
                new DateTimeOffset(file.LastWriteTimeUtc)));
        }

        var currentPath = GetRelativePath(directory.FullName);
        var parentPath = directory.Parent is null ? null : GetRelativePath(directory.Parent.FullName);
        if (string.IsNullOrEmpty(currentPath))
        {
            parentPath = null;
        }

        return new BrowseResponseDto(
            currentPath,
            parentPath,
            entries,
            new ViewStatsDto(fileCount, directoryCount, totalFileBytes));
    }

    public const int MaxSearchResults = 500;

    private static readonly EnumerationOptions RecursiveSearchOptions = new()
    {
        RecurseSubdirectories = true,
        IgnoreInaccessible = true,
        AttributesToSkip = FileAttributes.System | FileAttributes.ReparsePoint
    };

    public SearchResponseDto Search(string? relativePath, string? query, CancellationToken cancellationToken = default)
    {
        var absolutePath = GetAbsolutePath(relativePath);
        if (!Directory.Exists(absolutePath))
        {
            throw new DirectoryNotFoundException("Directory not found.");
        }

        var term = (query ?? string.Empty).Trim();
        if (string.IsNullOrEmpty(term))
        {
            return new SearchResponseDto(GetRelativePath(absolutePath), string.Empty, [], new ViewStatsDto(0, 0, 0));
        }

        var entries = new List<FileSystemEntryDto>();
        var fileCount = 0;
        var directoryCount = 0;
        long totalFileBytes = 0;
        var truncated = false;

        // Single pass over the tree; FileSystemInfo already carries the metadata we need,
        // so there is no second stat call per entry.
        foreach (var info in new DirectoryInfo(absolutePath).EnumerateFileSystemInfos("*", RecursiveSearchOptions))
        {
            cancellationToken.ThrowIfCancellationRequested();

            if (!info.Name.Contains(term, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (entries.Count >= MaxSearchResults)
            {
                truncated = true;
                break;
            }

            var isDirectory = (info.Attributes & FileAttributes.Directory) != 0;
            var size = isDirectory ? 0 : ((FileInfo)info).Length;

            if (isDirectory)
            {
                directoryCount++;
            }
            else
            {
                fileCount++;
                totalFileBytes += size;
            }

            entries.Add(new FileSystemEntryDto(
                info.Name,
                GetRelativePath(info.FullName),
                isDirectory,
                size,
                new DateTimeOffset(info.LastWriteTimeUtc)));
        }

        entries.Sort(static (a, b) =>
        {
            var byType = b.IsDirectory.CompareTo(a.IsDirectory);
            return byType != 0 ? byType : StringComparer.OrdinalIgnoreCase.Compare(a.Name, b.Name);
        });

        return new SearchResponseDto(
            GetRelativePath(absolutePath),
            term,
            entries,
            new ViewStatsDto(fileCount, directoryCount, totalFileBytes),
            truncated);
    }

    public async Task SaveUploadAsync(string relativePath, IFormFile file, CancellationToken cancellationToken)
    {
        var directoryPath = GetAbsolutePath(relativePath);
        if (!Directory.Exists(directoryPath))
        {
            throw new DirectoryNotFoundException("Target upload directory does not exist.");
        }

        var targetFilePath = Path.Combine(directoryPath, Path.GetFileName(file.FileName));
        await using var stream = File.Create(targetFilePath);
        await file.CopyToAsync(stream, cancellationToken);
    }

    public (string FullPath, string ContentType, string DownloadName) GetDownloadInfo(string relativePath)
    {
        var fullPath = GetAbsolutePath(relativePath);
        if (!File.Exists(fullPath))
        {
            throw new FileNotFoundException("File not found.", fullPath);
        }

        return (fullPath, "application/octet-stream", Path.GetFileName(fullPath));
    }

    public void DeletePath(string relativePath)
    {
        var absolutePath = GetAbsolutePath(relativePath);

        if (File.Exists(absolutePath))
        {
            File.Delete(absolutePath);
            return;
        }

        if (Directory.Exists(absolutePath))
        {
            Directory.Delete(absolutePath, true);
            return;
        }

        throw new FileNotFoundException("Path not found.", absolutePath);
    }

    public void MovePath(string sourceRelativePath, string destinationRelativePath, bool overwrite)
    {
        var sourceAbsolutePath = GetAbsolutePath(sourceRelativePath);
        var destinationAbsolutePath = GetAbsolutePath(destinationRelativePath);

        if (File.Exists(sourceAbsolutePath))
        {
            var destinationDirectory = Path.GetDirectoryName(destinationAbsolutePath);
            if (!string.IsNullOrWhiteSpace(destinationDirectory))
            {
                Directory.CreateDirectory(destinationDirectory);
            }

            File.Move(sourceAbsolutePath, destinationAbsolutePath, overwrite);
            return;
        }

        if (Directory.Exists(sourceAbsolutePath))
        {
            if (Directory.Exists(destinationAbsolutePath) || File.Exists(destinationAbsolutePath))
            {
                if (!overwrite)
                {
                    throw new IOException("Destination already exists.");
                }

                DeletePath(GetRelativePath(destinationAbsolutePath));
            }

            Directory.Move(sourceAbsolutePath, destinationAbsolutePath);
            return;
        }

        throw new FileNotFoundException("Source path not found.", sourceAbsolutePath);
    }

    public void CopyPath(string sourceRelativePath, string destinationRelativePath, bool overwrite)
    {
        var sourceAbsolutePath = GetAbsolutePath(sourceRelativePath);
        var destinationAbsolutePath = GetAbsolutePath(destinationRelativePath);

        if (File.Exists(sourceAbsolutePath))
        {
            var destinationDirectory = Path.GetDirectoryName(destinationAbsolutePath);
            if (!string.IsNullOrWhiteSpace(destinationDirectory))
            {
                Directory.CreateDirectory(destinationDirectory);
            }

            File.Copy(sourceAbsolutePath, destinationAbsolutePath, overwrite);
            return;
        }

        if (Directory.Exists(sourceAbsolutePath))
        {
            CopyDirectory(sourceAbsolutePath, destinationAbsolutePath, overwrite);
            return;
        }

        throw new FileNotFoundException("Source path not found.", sourceAbsolutePath);
    }

    private static void CopyDirectory(string sourceDirectory, string destinationDirectory, bool overwrite)
    {
        Directory.CreateDirectory(destinationDirectory);

        foreach (var file in Directory.GetFiles(sourceDirectory))
        {
            var destinationFile = Path.Combine(destinationDirectory, Path.GetFileName(file));
            File.Copy(file, destinationFile, overwrite);
        }

        foreach (var directory in Directory.GetDirectories(sourceDirectory))
        {
            var destinationChildDirectory = Path.Combine(destinationDirectory, Path.GetFileName(directory));
            CopyDirectory(directory, destinationChildDirectory, overwrite);
        }
    }
}
