using TestProject.Models;
using TestProject.Services;

namespace TestProject.Endpoints;

public static class FileBrowserEndpoints
{
    public static IEndpointRouteBuilder MapFileBrowserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/files");

        group.MapGet("/browse", Browse);
        group.MapGet("/search", Search);
        group.MapPost("/upload", Upload);
        group.MapGet("/download", Download);
        group.MapDelete("", Delete);
        group.MapPost("/move", Move);
        group.MapPost("/copy", Copy);
        group.MapGet("/root", Root);

        return app;
    }

    private static IResult Browse(string? path, FileBrowserService service)
    {
        try
        {
            return Results.Ok(service.Browse(path));
        }
        catch (Exception ex)
        {
            return ToProblem(ex);
        }
    }

    private static IResult Search(string? path, string? query, FileBrowserService service, CancellationToken cancellationToken)
    {
        try
        {
            return Results.Ok(service.Search(path, query, cancellationToken));
        }
        catch (OperationCanceledException)
        {
            return Results.StatusCode(StatusCodes.Status499ClientClosedRequest);
        }
        catch (Exception ex)
        {
            return ToProblem(ex);
        }
    }

    private static async Task<IResult> Upload(HttpRequest request, string? path, FileBrowserService service, CancellationToken cancellationToken)
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
    }

    private static IResult Download(string path, FileBrowserService service)
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
    }

    private static IResult Delete(string path, FileBrowserService service)
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
    }

    private static IResult Move(MoveCopyRequestDto request, FileBrowserService service)
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
    }

    private static IResult Copy(MoveCopyRequestDto request, FileBrowserService service)
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
    }

    private static IResult Root(FileBrowserService service)
    {
        return Results.Ok(new { root = service.RootPath });
    }

    private static IResult ToProblem(Exception ex)
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
}
