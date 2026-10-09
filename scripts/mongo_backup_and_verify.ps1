$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupRoot = "D:\MediMind_Backups"
$backupDir = Join-Path $backupRoot "MediMind_DB_Backup_$timestamp"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Ensure MongoDB Database Tools are available
$toolsDir = "$env:USERPROFILE\.mongodb-tools"
if (-not (Test-Path "$toolsDir\mongodump.exe")) {
    Write-Host "Downloading MongoDB Database Tools..."
    $url = "https://fastdl.mongodb.org/tools/db/mongodb-database-tools-windows-x86_64-100.9.0.zip"
    $zipPath = "$env:TEMP\mongo-tools.zip"
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Expand-Archive -Path $zipPath -DestinationPath $toolsDir -Force
    Remove-Item $zipPath
}

$mongodump = Get-ChildItem -Path $toolsDir -Recurse -Filter "mongodump.exe" | Select-Object -First 1
if (-not $mongodump) { throw "mongodump.exe not found after extraction" }
$mongorestore = Get-ChildItem -Path $toolsDir -Recurse -Filter "mongorestore.exe" | Select-Object -First 1
if (-not $mongorestore) { throw "mongorestore.exe not found after extraction" }
# Try to locate mongosh (MongoDB Shell)
$mongo = Get-ChildItem -Path $toolsDir -Recurse -Filter "mongosh.exe" | Select-Object -First 1
if (-not $mongo) {
    Write-Host "Downloading mongosh (MongoDB Shell)..."
    $mongoshUrl = "https://downloads.mongodb.com/compass/mongosh-2.2.0-win32-x64.zip"
    $mongoshZip = "$env:TEMP\mongosh.zip"
    Invoke-WebRequest -Uri $mongoshUrl -OutFile $mongoshZip -UseBasicParsing
    Expand-Archive -Path $mongoshZip -DestinationPath $toolsDir -Force
    Remove-Item $mongoshZip
    $mongo = Get-ChildItem -Path $toolsDir -Recurse -Filter "mongosh.exe" | Select-Object -First 1
    if (-not $mongo) { throw "mongosh.exe not found after extraction" }
}

# Perform the dump
Write-Host "Running mongodump..."
& $mongodump.FullName --uri="mongodb://127.0.0.1:27017" --out $backupDir --gzip
if ($LASTEXITCODE -ne 0) { throw "mongodump failed with exit code $LASTEXITCODE" }

# Build manifest
$manifest = @{
    host = "127.0.0.1"
    port = 27017
    backupTimestamp = $timestamp
    backupPath = $backupDir
    databases = @()
}
# List databases via mongo shell
$listJson = & $mongo.FullName --quiet --eval "JSON.stringify(db.adminCommand({listDatabases:1}))"
$databases = ($listJson | ConvertFrom-Json).databases
foreach ($dbInfo in $databases) {
    $dbName = $dbInfo.name
    $cmd = "var cols = db.getCollectionInfos().map(c=>({name:c.name, count: db.getCollection(c.name).count(), indexes: db.getCollection(c.name).getIndexes().map(i=>i.name)})); printjson(JSON.stringify(cols));"
    $colJson = & $mongo.FullName $dbName --quiet --eval $cmd
    $collections = $colJson | ConvertFrom-Json
    $manifest.databases += @{ name = $dbName; collections = $collections }
}
$manifestPath = Join-Path $backupDir "backup_manifest.json"
$manifest | ConvertTo-Json -Depth 5 | Out-File -FilePath $manifestPath -Encoding utf8

# Generate checksums
$hashes = Get-ChildItem -Recurse -File $backupDir | Get-FileHash -Algorithm SHA256
$hashPath = Join-Path $backupDir "checksums.sha256"
$hashes | ForEach-Object { "{0}  {1}" -f $_.Hash, $_.Path.Substring($backupDir.Length+1) } | Out-File -FilePath $hashPath -Encoding ascii

# Verification: restore to temporary databases and compare document counts
foreach ($dbInfo in $databases) {
    $origName = $dbInfo.name
    $tempName = "backup_verify_$origName"
    Write-Host "Restoring $origName to temporary $tempName for verification..."
    & $mongorestore.FullName --uri="mongodb://127.0.0.1:27017" --nsInclude "$origName.*" --nsFrom "$origName.*" --nsTo "$tempName.*" --gzip --dir $backupDir
    # Compare counts per collection
    foreach ($coll in ($manifest.databases | Where-Object { $_.name -eq $origName }).collections) {
        $origCount = $coll.count
        $tempCount = & $mongo.FullName $tempName --quiet --eval "db.getCollection('$($coll.name)').count()"
        if ([int]$origCount -ne [int]$tempCount) {
            Write-Warning "Count mismatch in $origName.$($coll.name): original $origCount vs restored $tempCount"
        }
    }
    # Drop temporary database after check
    Write-Host "Dropping temporary database $tempName"
    & $mongo.FullName --eval "db.getSiblingDB('$tempName').dropDatabase()" | Out-Null
}

Write-Host "Backup and verification completed. Backup located at $backupDir"
