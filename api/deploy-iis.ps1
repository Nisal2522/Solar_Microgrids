<#
.SYNOPSIS
    Deploys the published Web API to local IIS. Run this in an elevated
    (Run as Administrator) PowerShell prompt -- IIS site/app-pool creation
    requires admin rights that a normal dev shell does not have.

.DESCRIPTION
    Creates (or reuses) an IIS Application Pool with "No Managed Code" and
    an IIS site pointing at the already-published API in
    .\SolarMicrogrid.Api\publish, then starts both. Run
    `dotnet publish -c Release -o publish` from SolarMicrogrid.Api\ first
    (or after every code change) to refresh that folder before re-running
    this script.
#>

Import-Module WebAdministration

$siteName = "SolarMicrogridApi"
$appPoolName = "SolarMicrogridApiPool"
$physicalPath = Join-Path $PSScriptRoot "SolarMicrogrid.Api\publish"
$port = 8081

if (-not (Test-Path $physicalPath)) {
    Write-Error "Publish output not found at $physicalPath. Run 'dotnet publish -c Release -o publish' from SolarMicrogrid.Api\ first."
    exit 1
}

# Creates the app pool with no managed CLR (ASP.NET Core is self-hosted via the module, not the classic CLR).
if (-not (Test-Path "IIS:\AppPools\$appPoolName")) {
    New-WebAppPool -Name $appPoolName | Out-Null
}
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name managedRuntimeVersion -Value ""
Set-ItemProperty "IIS:\AppPools\$appPoolName" -Name startMode -Value "AlwaysRunning"

# Creates the site bound to $port, or repoints it if it already exists.
if (-not (Test-Path "IIS:\Sites\$siteName")) {
    New-Website -Name $siteName -Port $port -PhysicalPath $physicalPath -ApplicationPool $appPoolName | Out-Null
} else {
    Set-ItemProperty "IIS:\Sites\$siteName" -Name physicalPath -Value $physicalPath
    Set-ItemProperty "IIS:\Sites\$siteName" -Name applicationPool -Value $appPoolName
}

Start-WebAppPool -Name $appPoolName -ErrorAction SilentlyContinue
Start-Website -Name $siteName -ErrorAction SilentlyContinue

Write-Host "Deployed. API should be reachable at http://localhost:$port/api" -ForegroundColor Green
Write-Host "Update web/.env and mobile/app/src/main/java/com/solarmicrogrid/app/util/Constants.kt to point at this URL." -ForegroundColor Yellow
