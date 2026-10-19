$proc = Get-Process mongod -ErrorAction SilentlyContinue
if ($proc) {
    Write-Host "Mongod process found: PID $($proc.Id)"
} else {
    Write-Host "No mongod process running."
}

$svc = Get-Service *mongo* -ErrorAction SilentlyContinue
if ($svc) {
    Write-Host "MongoDB service found:"
    $svc | Format-Table -AutoSize
} else {
    Write-Host "No MongoDB Windows service found."
}

$tcp = Test-NetConnection -ComputerName 127.0.0.1 -Port 27017 -InformationLevel Quiet
Write-Host "Port 27017 listening: $tcp"

Write-Host "`nACL for Data Directory:"
(Get-Acl "C:\Program Files\MongoDB\Server\8.0\data").Access | Select-Object IdentityReference, FileSystemRights, AccessControlType | Format-Table -AutoSize

Write-Host "`nACL for Log Directory:"
(Get-Acl "C:\Program Files\MongoDB\Server\8.0\log").Access | Select-Object IdentityReference, FileSystemRights, AccessControlType | Format-Table -AutoSize

Write-Host "`nExecutable check:"
if (Test-Path "C:\Users\Boga Vishnuvaradhan\.mongodb-tools\mongodb-8.0.13\mongod.exe") {
    Write-Host "mongod.exe exists at verified path."
} else {
    Write-Host "mongod.exe NOT found!"
}
