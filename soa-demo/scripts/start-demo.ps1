$baseDir = Resolve-Path "$PSScriptRoot/.."
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Starting MediMind Service-Oriented Architecture (SOA)  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Start Infrastructure
& "$PSScriptRoot/start-infra.ps1"

# 2. Start API Gateway (Port 5050)
Write-Host "[Launch] Starting API Gateway on port 5050..." -ForegroundColor Green
$gatewayProcess = Start-Process -FilePath "node" -ArgumentList "$baseDir/api-gateway/src/index.js" -WorkingDirectory "$baseDir/api-gateway" -PassThru

# 3. Start AI Prediction Consumer (Port 8001)
Write-Host "[Launch] Starting AI Prediction Consumer on port 8001..." -ForegroundColor Green
$predictionProcess = Start-Process -FilePath "python" -ArgumentList "$baseDir/prediction-consumer/app/main.py" -WorkingDirectory "$baseDir/prediction-consumer" -PassThru

# 4. Start Notification Consumer (Port 8002)
Write-Host "[Launch] Starting Notification Consumer on port 8002..." -ForegroundColor Green
$notificationProcess = Start-Process -FilePath "node" -ArgumentList "$baseDir/notification-consumer/src/index.js" -WorkingDirectory "$baseDir/notification-consumer" -PassThru

# Save PIDs
$pids = @{
    gateway = $gatewayProcess.Id
    prediction = $predictionProcess.Id
    notification = $notificationProcess.Id
} | ConvertTo-Json

Set-Content -Path "$baseDir/.demo-pids.json" -Value $pids

Write-Host "Waiting 6 seconds for services to register with Eureka..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

Write-Host "`nAll MediMind SOA services launched successfully!" -ForegroundColor Green
Write-Host "   Eureka Dashboard:       http://localhost:8761"
Write-Host "   API Gateway Health:     http://localhost:5050/health"
Write-Host "   API Gateway SOA Status: http://localhost:5050/api/soa/status"
Write-Host "   Service Discovery:      http://localhost:5050/api/soa/services"
Write-Host "   Prediction Consumer:    http://localhost:8001/health"
Write-Host "   Notification Consumer:  http://localhost:8002/health"
