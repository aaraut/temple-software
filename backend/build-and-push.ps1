# Builds the backend Docker image tagged with the version from pom.xml,
# pushes it to Docker Hub, and syncs docker-compose.yml's APP_VERSION.
#
# Usage: run from anywhere; cd's into backend/ itself.
#   .\backend\build-and-push.ps1

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

$version = & .\mvnw.cmd -q -Dexpression=project.version -DforceStdout help:evaluate
$version = $version.Trim()

if ([string]::IsNullOrWhiteSpace($version)) {
    throw "Could not read project.version from pom.xml"
}

Write-Host "Building alekhraut/temple-backend:$version ..."
docker build -t "alekhraut/temple-backend:$version" .
if (-not $?) { throw "docker build failed" }

$envFile = Join-Path $scriptDir "..\.env"
Set-Content -Path $envFile -Value "APP_VERSION=$version" -Encoding utf8
Write-Host "Updated $envFile -> APP_VERSION=$version"

Write-Host "Pushing alekhraut/temple-backend:$version ..."
docker push "alekhraut/temple-backend:$version"

Write-Host "Done. On the server, run: docker compose pull backend && docker compose up -d"
