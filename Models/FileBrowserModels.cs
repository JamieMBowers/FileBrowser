namespace TestProject.Models;

public record FileSystemEntryDto(
    string Name,
    string RelativePath,
    bool IsDirectory,
    long Size,
    DateTimeOffset LastModifiedUtc);

public record ViewStatsDto(
    int FileCount,
    int DirectoryCount,
    long TotalFileBytes);

public record BrowseResponseDto(
    string CurrentPath,
    string? ParentPath,
    IReadOnlyList<FileSystemEntryDto> Entries,
    ViewStatsDto Stats);

public record SearchResponseDto(
    string CurrentPath,
    string Query,
    IReadOnlyList<FileSystemEntryDto> Entries,
    ViewStatsDto Stats,
    bool Truncated = false);

public record MoveCopyRequestDto(
    string SourcePath,
    string DestinationPath,
    bool Overwrite);
