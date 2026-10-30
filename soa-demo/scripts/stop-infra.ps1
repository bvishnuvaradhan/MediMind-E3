Write-Host "[SOA Infrastructure] Stopping Kafka and Eureka containers..." -ForegroundColor Yellow
docker compose -f "$PSScriptRoot/../docker-compose.yml" down -v
Write-Host "[SOA Infrastructure] Infrastructure stopped." -ForegroundColor Green
