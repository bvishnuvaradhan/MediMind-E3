# MediMind — Automated Scheduled Backup Registration Script
# Registers a Windows Scheduled Task to run mongo_backup_and_verify.ps1 daily at 02:00 AM

param(
    [string]$TaskName = "MediMind_Daily_MongoDB_Backup",
    [string]$Time = "02:00AM"
)

$scriptPath = "D:\projects\MediMind\scripts\mongo_backup_and_verify.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Error "Backup script not found at: $scriptPath"
    exit 1
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)
$description = "Automated daily MongoDB backup and isolated restore verification for MediMind 8 core databases with 30-day retention."

Write-Host "Registering Scheduled Task: $TaskName..."
try {
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description $description -Force | Out-Null
    Write-Host "Successfully registered Scheduled Task '$TaskName' to run daily at $Time."
    Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
} catch {
    Write-Warning "Could not register scheduled task automatically (may require Elevated Administrator privileges): $($_.Exception.Message)"
    Write-Host "`nTo register manually in an elevated PowerShell terminal, run:"
    Write-Host "schtasks /Create /SC DAILY /TN `"$TaskName`" /TR `"powershell.exe -ExecutionPolicy Bypass -File \`"$scriptPath\`"`" /ST 02:00 /F"
}
