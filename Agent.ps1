# Set the number of times to run
$maxRuns = 15

for ($i = 1; $i -le $maxRuns; $i++) {
    Write-Host "--------------------------------"
    Write-Host "♻️  RESTARTING AGENT... (Run $i of $maxRuns)"
    Get-Content PROMPT.md | gemini --yolo
    Start-Sleep -Milliseconds 500
}