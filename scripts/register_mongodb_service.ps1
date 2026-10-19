# MediMind - Windows Service Registration for MongoDB 8.0.13
# Must be executed in PowerShell as Administrator

$ErrorActionPreference = "Stop"

Write-Host "=== MediMind MongoDB 8.0.13 Windows Service Registration ===" -ForegroundColor Cyan

$mongodExe = "C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-8.0.13\mongod.exe"
$cfgPath   = "C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-8.0.13\mongod.cfg"
$serviceName = "MongoDB"

# 1. Verify files exist
if (-not (Test-Path $mongodExe)) {
    Write-Error "mongod.exe not found at $mongodExe"
    exit 1
}
if (-not (Test-Path $cfgPath)) {
    Write-Error "mongod.cfg not found at $cfgPath"
    exit 1
}

# 2. Check if service already exists
$existingSvc = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingSvc) {
    Write-Host "Found existing service $serviceName (Status: $($existingSvc.Status)). Stopping and removing..." -ForegroundColor Yellow
    if ($existingSvc.Status -eq 'Running') {
        Stop-Service -Name $serviceName -Force
    }
    & $mongodExe --serviceName $serviceName --remove
    Start-Sleep -Seconds 2
}

# 3. Register service with NT AUTHORITY\NetworkService
Write-Host "Installing Windows Service '$serviceName'..." -ForegroundColor Green
& $mongodExe --config $cfgPath --serviceName $serviceName --serviceDisplayName "MongoDB Server" --serviceDescription "MongoDB Database Server (v8.0.13) for MediMind" --serviceUser "NT AUTHORITY\NetworkService" --install

# 4. Enforce Manual startup initially (Requirement 6)
Write-Host "Configuring StartupType to 'Manual'..." -ForegroundColor Green
Set-Service -Name $serviceName -StartupType Manual

# 5. Start the service
Write-Host "Starting service '$serviceName'..." -ForegroundColor Green
Start-Service -Name $serviceName

# 6. Verify status
$svc = Get-Service -Name $serviceName
Write-Host "`nService Status:" -ForegroundColor Cyan
$svc | Format-Table -AutoSize

Write-Host "Service registration complete." -ForegroundColor Green
