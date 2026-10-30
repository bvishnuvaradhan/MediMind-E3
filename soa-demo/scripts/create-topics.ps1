Write-Host "[Kafka] Verifying and creating required MediMind topics..." -ForegroundColor Cyan

$topics = @("medimind.predictions", "medimind.appointments", "medimind.notifications")

foreach ($topic in $topics) {
    docker exec medimind-kafka /opt/kafka/bin/kafka-topics.sh `
        --create `
        --topic $topic `
        --bootstrap-server localhost:9092 `
        --partitions 3 `
        --replication-factor 1 `
        --if-not-exists
}

Write-Host "[Kafka] Active Topics:" -ForegroundColor Green
docker exec medimind-kafka /opt/kafka/bin/kafka-topics.sh --list --bootstrap-server localhost:9092
