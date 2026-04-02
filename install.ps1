# XETHRYON Install Script for Windows
# Usage: irm https://raw.githubusercontent.com/EstarinAzx/XETHRYON/master/install.ps1 | iex

$ErrorActionPreference = "Stop"

$repo = "EstarinAzx/XETHRYON"
$binaryName = "xethryon.exe"
$target = "opencode-windows-x64"

# Install directory
if ($env:XETHRYON_INSTALL_DIR) {
    $installDir = $env:XETHRYON_INSTALL_DIR
} else {
    $installDir = "$env:LOCALAPPDATA\xethryon\bin"
}

New-Item -ItemType Directory -Force -Path $installDir | Out-Null

Write-Host ""
Write-Host "  XETHRYON — NEURAL INTERFACE" -ForegroundColor Cyan
Write-Host "  Installing for Windows x64..." -ForegroundColor DarkGray
Write-Host "  Target: $installDir\$binaryName" -ForegroundColor DarkGray
Write-Host ""

# Try to get latest release
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/$repo/releases/latest" -Headers @{ "User-Agent" = "XETHRYON-Installer" }
    $asset = $release.assets | Where-Object { $_.name -match $target } | Select-Object -First 1

    if (-not $asset) {
        throw "No release asset found"
    }

    $downloadUrl = $asset.browser_download_url
    $tempZip = "$env:TEMP\xethryon-download.zip"

    Write-Host "  Downloading from release..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tempZip -UseBasicParsing

    Write-Host "  Extracting..." -ForegroundColor Yellow
    $tempExtract = "$env:TEMP\xethryon-extract"
    if (Test-Path $tempExtract) { Remove-Item -Recurse -Force $tempExtract }
    Expand-Archive -Path $tempZip -DestinationPath $tempExtract -Force

    $exe = Get-ChildItem -Path $tempExtract -Filter "opencode.exe" -Recurse | Select-Object -First 1
    if ($exe) {
        Copy-Item -Path $exe.FullName -Destination "$installDir\$binaryName" -Force
    } else {
        throw "Binary not found in archive"
    }

    Remove-Item -Force $tempZip -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force $tempExtract -ErrorAction SilentlyContinue

} catch {
    Write-Host "  No release found. Falling back to build from source..." -ForegroundColor DarkYellow
    Write-Host ""
    Write-Host "  To install from source:" -ForegroundColor White
    Write-Host "    git clone https://github.com/$repo.git" -ForegroundColor Gray
    Write-Host "    cd XETHRYON" -ForegroundColor Gray
    Write-Host "    bun install" -ForegroundColor Gray
    Write-Host "    cd packages\opencode" -ForegroundColor Gray
    Write-Host "    bun run build --single --skip-embed-web-ui" -ForegroundColor Gray
    Write-Host ""
    exit 1
}

# Add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$installDir*") {
    Write-Host "  Adding to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$installDir", "User")
    $env:Path = "$env:Path;$installDir"
}

Write-Host ""
Write-Host "  Installed: $installDir\$binaryName" -ForegroundColor Green
Write-Host ""
Write-Host "  Restart your terminal, then run:" -ForegroundColor White
Write-Host "    xethryon" -ForegroundColor Cyan
Write-Host ""
