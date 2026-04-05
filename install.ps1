#!/usr/bin/env pwsh
# Xethryon Installer for Windows x64
# Usage: irm https://raw.githubusercontent.com/EstarinAzx/XETHRYON/xethryon/install.ps1 | iex

$ErrorActionPreference = "Stop"

$repo = "EstarinAzx/XETHRYON"
$dest = "$env:LOCALAPPDATA\xethryon\bin"
$exe = "$dest\xethryon.exe"

Write-Host "Installing Xethryon..." -ForegroundColor Cyan

# Get latest release download URL
$release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
$asset = $release.assets | Where-Object { $_.name -eq "xethryon-windows-x64.exe" }

if (-not $asset) {
    Write-Host "Error: No Windows binary found in latest release." -ForegroundColor Red
    exit 1
}

$url = $asset.browser_download_url
Write-Host "Downloading from $url"

# Create directory and download
New-Item -ItemType Directory -Force -Path $dest | Out-Null
Invoke-WebRequest -Uri $url -OutFile $exe -UseBasicParsing

# Add to PATH if not already there
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$dest*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$dest", "User")
    $env:Path = "$env:Path;$dest"
    Write-Host "Added $dest to PATH" -ForegroundColor Green
}

Write-Host ""
Write-Host "Xethryon installed to $exe" -ForegroundColor Green
Write-Host "Version: $($release.tag_name)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Open a new terminal and run: xethryon" -ForegroundColor Cyan
