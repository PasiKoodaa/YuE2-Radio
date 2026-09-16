param(
    [ValidateSet("cuda", "vulkan", "cpu", "")]
    [string]$Backend = "",
    [ValidateSet("q4", "q8", "")]
    [string]$Quantization = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$Root = Split-Path -Parent $PSScriptRoot
$Runtime = Join-Path $Root "runtime"
$ToolsDir = Join-Path $Runtime "audio.cpp"
$ModelsDir = Join-Path $Runtime "models\Yue2-3B-GGUF"
$DownloadsDir = Join-Path $Runtime "downloads"

function Step([string]$Message) {
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Download-File([string]$Url, [string]$Destination) {
    $Parent = Split-Path -Parent $Destination
    New-Item -ItemType Directory -Path $Parent -Force | Out-Null
    if (Test-Path $Destination) {
        Write-Host "Using existing $([IO.Path]::GetFileName($Destination))"
        return
    }
    $Partial = "$Destination.part"
    Write-Host "Downloading $([IO.Path]::GetFileName($Destination))"
    & curl.exe -L --fail --retry 5 --retry-delay 3 -C - -o $Partial $Url
    if ($LASTEXITCODE -ne 0) { throw "Download failed: $Url" }
    Move-Item -Path $Partial -Destination $Destination -Force
}

Write-Host "RADIO - Windows first-time setup" -ForegroundColor Magenta
Write-Host "This downloads the current audio.cpp release and your chosen Yue2 model files."

$Node = Get-Command node.exe -ErrorAction SilentlyContinue
if (-not $Node) {
    throw "Node.js 18 or newer is not installed. Download the LTS installer from https://nodejs.org/en/download"
}

if (-not $Backend) {
    $GpuNames = @(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue | ForEach-Object { $_.Name })
    $Suggested = if ($GpuNames -match "NVIDIA") { "1" } else { "2" }
    Write-Host ""
    Write-Host "Detected graphics: $($GpuNames -join ', ')"
    Write-Host "1. CUDA   - NVIDIA GPU (recommended when available)"
    Write-Host "2. Vulkan - AMD, Intel, or NVIDIA GPU"
    Write-Host "3. CPU    - compatibility mode; music generation can be very slow"
    $Choice = Read-Host "Choose 1, 2, or 3 [$Suggested]"
    if (-not $Choice) { $Choice = $Suggested }
    $Backend = switch ($Choice) { "1" { "cuda" } "2" { "vulkan" } "3" { "cpu" } default { throw "Invalid backend choice." } }
}

if (-not $Quantization) {
    Write-Host ""
    Write-Host "1. Q4_0 - smaller download (2.67 GB), about 7.8 GB peak VRAM"
    Write-Host "2. Q8_0 - higher precision (4.26 GB), about 8.9 GB peak VRAM"
    $Choice = Read-Host "Choose 1 or 2 [1]"
    if (-not $Choice) { $Choice = "1" }
    $Quantization = switch ($Choice) { "1" { "q4" } "2" { "q8" } default { throw "Invalid model choice." } }
}

$RequiredDisk = if ($Quantization -eq "q8") { 7GB } else { 5GB }
$DriveName = [IO.Path]::GetPathRoot($Root).TrimEnd("\").TrimEnd(":")
$Drive = Get-PSDrive -Name $DriveName
if ($Drive.Free -lt $RequiredDisk) { throw "At least $([Math]::Ceiling($RequiredDisk / 1GB)) GB of free disk space is required for this model." }
$MainModelName = if ($Quantization -eq "q8") { "yue2-3b-q8_0.gguf" } else { "yue2-3b-q4_0.gguf" }
$QuantizationLabel = if ($Quantization -eq "q8") { "Q8_0" } else { "Q4_0" }

New-Item -ItemType Directory -Path $ToolsDir, $ModelsDir, $DownloadsDir -Force | Out-Null

Step "Finding the latest audio.cpp Windows release"
$Headers = @{ "User-Agent" = "localwave-radio-setup"; "Accept" = "application/vnd.github+json" }
$Release = Invoke-RestMethod -Uri "https://api.github.com/repos/0xShug0/audio.cpp/releases/latest" -Headers $Headers
$WindowsZips = @($Release.assets | Where-Object { $_.name -match "windows.*\.zip$" })

if ($Backend -eq "cuda") {
    $Matches = @($WindowsZips | Where-Object { $_.name -match "cuda" })
    $Preferred = @($Matches | Where-Object { $_.name -match "runtime|portable" })
    if ($Preferred.Count -gt 0) { $Matches = $Preferred }
} elseif ($Backend -eq "vulkan") {
    $Matches = @($WindowsZips | Where-Object { $_.name -match "vulkan" })
    $Preferred = @($Matches | Where-Object { $_.name -match "portable" })
    if ($Preferred.Count -gt 0) { $Matches = $Preferred }
} else {
    $Matches = @($WindowsZips | Where-Object { $_.name -match "cpu.*portable|portable.*cpu" })
    if ($Matches.Count -eq 0) { $Matches = @($WindowsZips | Where-Object { $_.name -match "cpu" }) }
}

if ($Matches.Count -eq 0) {
    throw "The latest audio.cpp release has no Windows $Backend package. See https://github.com/0xShug0/audio.cpp/releases/latest"
}

Remove-Item -Path (Join-Path $ToolsDir "*") -Recurse -Force -ErrorAction SilentlyContinue
foreach ($Asset in $Matches) {
    $Archive = Join-Path $DownloadsDir $Asset.name
    Download-File $Asset.browser_download_url $Archive
    Write-Host "Extracting $($Asset.name)"
    Expand-Archive -Path $Archive -DestinationPath $ToolsDir -Force
}

$AudioServer = Get-ChildItem -Path $ToolsDir -Filter "audiocpp_server.exe" -File -Recurse | Select-Object -First 1
if (-not $AudioServer) { throw "The downloaded package did not contain audiocpp_server.exe." }

Step "Downloading Yue2 $QuantizationLabel model files"
$HfBase = "https://huggingface.co/audio-cpp/Yue2-3B-GGUF/resolve/main"
$ModelFiles = @(
    $MainModelName,
    "yue2-vae-f16.gguf",
    "sidecars/yue2-model-config.json",
    "sidecars/yue2-generation-config.json",
    "sidecars/yue2-qwen.tiktoken",
    "sidecars/yue2-vae-config.json"
)
foreach ($Relative in $ModelFiles) {
    $Url = "$HfBase/$($Relative -replace '\\','/')?download=true"
    $Destination = Join-Path $ModelsDir ($Relative -replace "/", "\")
    Download-File $Url $Destination
}

Step "Writing the local Yue2 server configuration"
$ServerConfig = [ordered]@{
    host = "127.0.0.1"
    port = 8080
    backend = $Backend
    device = 0
    threads = [Math]::Max(1, [Environment]::ProcessorCount - 2)
    lazy_load = $true
    busy_timeout_ms = 1200000
    models = @(
        [ordered]@{
            id = "yue2-radio"
            family = "yue2"
            path = $ModelsDir
            task = "gen"
            mode = "offline"
            session_options = [ordered]@{
                "yue2.model_gguf" = $MainModelName
                "yue2.vae_gguf" = "yue2-vae-f16.gguf"
            }
            default_request_options = [ordered]@{
                cot = "off"
                num_inference_steps = 8
            }
        }
    )
}

$Json = $ServerConfig | ConvertTo-Json -Depth 10
$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText((Join-Path $Runtime "server.json"), $Json, $Utf8NoBom)
[IO.File]::WriteAllText((Join-Path $Runtime ".setup-complete"), "audio.cpp $($Release.tag_name)`nbackend=$Backend`nquantization=$Quantization`n", $Utf8NoBom)

Step "Setup complete"
Write-Host "audio.cpp: $($Release.tag_name) ($Backend)"
Write-Host "Yue2 model: $QuantizationLabel + F16 VAE"
Write-Host ""
Write-Host "Next:"
Write-Host "1. Install/open LM Studio and load a text model."
Write-Host "2. In LM Studio, open Developer and switch Start server on."
Write-Host "3. Double-click START-RADIO-WINDOWS.bat."
