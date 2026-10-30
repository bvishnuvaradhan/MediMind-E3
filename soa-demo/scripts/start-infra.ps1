Write-Host "[SOA Infrastructure] Starting Apache Kafka and Netflix Eureka Server via Docker Compose..." -ForegroundColor Cyan

docker compose -f "$PSScriptRoot/../docker-compose.yml" up -d

Write-Host "[SOA Infrastructure] Waiting for containers to become healthy..." -ForegroundColor Yellow
$timeoutSeconds = 40
$elapsed = 0
$healthy = $false

while ($elapsed -lt $timeoutSeconds) {
    Start-Sleep -Seconds 3
    $elapsed += 3
    
    $kafkaHealthy = (docker inspect --format='{{json .State.Health.Status}}' medimind-kafka 2>$null) -match "healthy"
    $eurekaHealthy = (docker inspect --format='{{json .State.Health.Status}}' medimind-eureka 2>$null) -match "healthy"

    if ($kafkaHealthy -and $eurekaHealthy) {
        $healthy = $true
        break
    }
    Write-Host "   Waiting... ($elapsed/$timeoutSeconds s) Kafka: $kafkaHealthy, Eureka: $eurekaHealthy"
}

if ($healthy) {
    Write-Host "[SOA Infrastructure] Kafka and Eureka are healthy!" -ForegroundColor Green
    & "$PSScriptRoot/create-topics.ps1"
} else {
    Write-Host "[SOA Infrastructure] Warning: Health check timed out, checking container status:" -ForegroundColor Red
    docker compose -f "$PSScriptRoot/../docker-compose.yml" ps
}
