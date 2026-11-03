using TestProject.Models;
using TestProject.Services;

var contentRoot = ResolveContentRoot();

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = contentRoot,
    WebRootPath = "wwwroot"
});

var configuredRoot = builder.Configuration["FileBrowser:RootPath"]
    ?? Environment.GetEnvironmentVariable("FILE_BROWSER_ROOT")
    ?? "SampleData";

var absoluteRoot = Path.IsPathRooted(configuredRoot)
    ? configuredRoot
    : Path.Combine(builder.Environment.ContentRootPath, configuredRoot);

builder.Services.AddSingleton(new FileBrowserService(absoluteRoot));

var app = builder.Build();

app.UseStaticFiles();

app.MapGet("/api/files/browse", (string? path, FileBrowserService service) =>
{
    try
    {
        var result = service.Browse(path);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapGet("/api/files/search", (string? path, string? query, FileBrowserService service, CancellationToken cancellationToken) =>
{
    try
    {
        var result = service.Search(path, query, cancellationToken);
        return Results.Ok(result);
    }
    catch (OperationCanceledException)
    {
        return Results.StatusCode(StatusCodes.Status499ClientClosedRequest);
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapPost("/api/files/upload", async (HttpRequest request, string? path, FileBrowserService service, CancellationToken cancellationToken) =>
{
    try
    {
        if (!request.HasFormContentType)
        {
            return Results.BadRequest(new { message = "Expected multipart/form-data." });
        }

        var form = await request.ReadFormAsync(cancellationToken);
        var file = form.Files.FirstOrDefault();

        if (file is null)
        {
            return Results.BadRequest(new { message = "No file was uploaded." });
        }

        await service.SaveUploadAsync(path ?? string.Empty, file, cancellationToken);
        return Results.Ok(new { message = "Upload complete." });
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapGet("/api/files/download", (string path, FileBrowserService service) =>
{
    try
    {
        var download = service.GetDownloadInfo(path);
        return Results.File(download.FullPath, download.ContentType, download.DownloadName);
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapDelete("/api/files", (string path, FileBrowserService service) =>
{
    try
    {
        service.DeletePath(path);
        return Results.Ok(new { message = "Deleted." });
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapPost("/api/files/move", (MoveCopyRequestDto request, FileBrowserService service) =>
{
    try
    {
        service.MovePath(request.SourcePath, request.DestinationPath, request.Overwrite);
        return Results.Ok(new { message = "Moved." });
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapPost("/api/files/copy", (MoveCopyRequestDto request, FileBrowserService service) =>
{
    try
    {
        service.CopyPath(request.SourcePath, request.DestinationPath, request.Overwrite);
        return Results.Ok(new { message = "Copied." });
    }
    catch (Exception ex)
    {
        return ToProblem(ex);
    }
});

app.MapGet("/api/files/root", (FileBrowserService service) => Results.Ok(new
{
    root = service.RootPath
}));

app.MapFallbackToFile("index.html");

app.Run();

static IResult ToProblem(Exception ex)
{
    return ex switch
    {
        FileNotFoundException => Results.NotFound(new { message = ex.Message }),
        DirectoryNotFoundException => Results.NotFound(new { message = ex.Message }),
        InvalidOperationException => Results.BadRequest(new { message = ex.Message }),
        UnauthorizedAccessException => Results.Problem(ex.Message, statusCode: StatusCodes.Status403Forbidden),
        IOException => Results.BadRequest(new { message = ex.Message }),
        _ => Results.Problem(ex.Message)
    };
}

static string ResolveContentRoot()
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

static string? FindProjectRoot(string startPath)
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
