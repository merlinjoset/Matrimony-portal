# ---- Build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet restore src/BackendPortalAPI.Api/BackendPortalAPI.Api.csproj
RUN dotnet publish src/BackendPortalAPI.Api/BackendPortalAPI.Api.csproj \
    -c Release -o /app /p:UseAppHost=false

# ---- Runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_ENVIRONMENT=Production
# Don't watch appsettings files for changes: the FileSystemWatcher/inotify would exhaust
# the container's low inotify limit and crash at startup ("inotify instances ... reached").
ENV DOTNET_hostBuilder__reloadConfigOnChange=false
# Render injects $PORT at runtime; bind ASP.NET Core to it (fallback 8080 for local runs).
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet BackendPortalAPI.Api.dll"]
