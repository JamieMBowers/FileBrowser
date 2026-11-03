using TestProject;
using TestProject.Endpoints;
using TestProject.Services;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = ContentRootLocator.Resolve(),
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
app.MapFileBrowserEndpoints();
app.MapFallbackToFile("index.html");

app.Run();
