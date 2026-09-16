$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Runtime = Join-Path $Root "runtime"
$ServerConfig = Join-Path $Runtime "server.json"

function Test-LocalUrl([string]$Url) {
    try {
        Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
        return $true
    } catch { return $false }
}

Write-Host ""
Write-Host "RADIO - Local AI Airwaves" -ForegroundColor Magenta
Write-Host "--------------------------"

$Node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $Node) {
    Write-Host "Node.js was not found." -ForegroundColor Red
    Write-Host "Install the current LTS version from https://nodejs.org/en/download and run this file again."
    exit 1
}

$NodeMajor = [int]((& node.exe --version).TrimStart("v").Split(".")[0])
if ($NodeMajor -lt 18) {
    Write-Host "Node.js 18 or newer is required. Your version is $(& node.exe --version)." -ForegroundColor Red
    exit 1
}

if (-not (Test-LocalUrl "http://127.0.0.1:1234/v1/models")) {
    $Lms = Get-Command lms.exe -ErrorAction SilentlyContinue
    if ($Lms) {
        Write-Host "Starting the LM Studio server..."
        Start-Process -FilePath $Lms.Source -ArgumentList @("server", "start") -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
}

if (-not (Test-LocalUrl "http://127.0.0.1:8080/health")) {
    $AudioServer = Get-ChildItem -Path (Join-Path $Runtime "audio.cpp") -Filter "audiocpp_server.exe" -File -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($AudioServer -and (Test-Path $ServerConfig)) {
        Write-Host "Starting audio.cpp with Yue2..."
        $QuotedConfig = '"' + $ServerConfig + '"'
        Start-Process -FilePath $AudioServer.FullName -ArgumentList @("--config", $QuotedConfig, "--no-ui") -WorkingDirectory $AudioServer.DirectoryName
        Start-Sleep -Seconds 2
    } else {
        Write-Host "Yue2 is not installed yet. Run SETUP-RADIO-WINDOWS.bat once." -ForegroundColor Yellow
    }
}

if (-not (Test-LocalUrl "http://127.0.0.1:1234/v1/models")) {
    Write-Host "LM Studio is offline. In LM Studio, load a text model and enable Developer > Start server." -ForegroundColor Yellow
}
if (-not (Test-LocalUrl "http://127.0.0.1:8080/health")) {
    Write-Host "audio.cpp is still starting or unavailable. Radio will let you test it again from the gear menu." -ForegroundColor Yellow
}

Set-Location $Root
& node.exe server.mjs
exit $LASTEXITCODE
