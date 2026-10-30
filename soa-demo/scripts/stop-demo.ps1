$baseDir = Resolve-Path "$PSScriptRoot/.."
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "   Stopping MediMind SOA Demonstration Services           " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow

$pidFile = "$baseDir/.demo-pids.json"
if (Test-Path $pidFile) {
    $pids = Get-Content $pidFile | ConvertFrom-Json
    foreach ($procName in @("gateway", "prediction", "notification")) {
        $id = $pids.$procName
        if ($id) {
            Write-Host "Stopping $procName process (PID: $id)..."
            Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

# Stop Docker infrastructure
& "$PSScriptRoot/stop-infra.ps1"

Write-Host "MediMind SOA demonstration stopped successfully." -ForegroundColor Green
