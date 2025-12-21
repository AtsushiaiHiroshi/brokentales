# Broken Tales - Actor Recovery Script
# Checks if actors exist in Foundry worlds and can be exported

Write-Host "Broken Tales | Actor Recovery Tool" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Try to find Foundry Data folder
$possiblePaths = @(
    "F:\ROL\Tools for DM\Foundry VTT\Contenido\Data",
    "$env:LOCALAPPDATA\FoundryVTT\Data",
    "$env:APPDATA\FoundryVTT\Data"
)

$foundryDataPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path "$path\worlds") {
        $foundryDataPath = $path
        Write-Host "Found Foundry Data at: $foundryDataPath" -ForegroundColor Green
        break
    }
}

if (-not $foundryDataPath) {
    Write-Host "ERROR: Could not find Foundry VTT Data folder" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please provide the path to your Foundry Data folder:" -ForegroundColor Yellow
    $customPath = Read-Host "Path"
    if (Test-Path "$customPath\worlds") {
        $foundryDataPath = $customPath
    }
    else {
        Write-Host "Invalid path. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Scanning worlds for Broken Tales actors..." -ForegroundColor Yellow
Write-Host ""

$worldsPath = Join-Path $foundryDataPath "worlds"
$worlds = Get-ChildItem -Path $worldsPath -Directory

$totalActors = 0
$actorsByWorld = @{}

foreach ($world in $worlds) {
    $actorsDbPath = Join-Path $world.FullName "data\actors.db"
    
    if (Test-Path $actorsDbPath) {
        # Read the LevelDB file (it's a text-based format)
        $content = Get-Content $actorsDbPath -Raw -ErrorAction SilentlyContinue
        
        if ($content) {
            # Count actors with "brokentales" system
            $matches = [regex]::Matches($content, '"system":"brokentales"')
            $actorCount = $matches.Count
            
            if ($actorCount -gt 0) {
                $actorsByWorld[$world.Name] = $actorCount
                $totalActors += $actorCount
                Write-Host "  World: $($world.Name)" -ForegroundColor Cyan
                Write-Host "    Actors found: $actorCount" -ForegroundColor Green
            }
        }
    }
}

Write-Host ""
if ($totalActors -eq 0) {
    Write-Host "No Broken Tales actors found in any world." -ForegroundColor Red
    Write-Host ""
    Write-Host "Recovery options:" -ForegroundColor Yellow
    Write-Host "  1. Check Windows Recycle Bin for deleted files" -ForegroundColor White
    Write-Host "  2. Restore from backup (if available)" -ForegroundColor White
    Write-Host "  3. Use file recovery software (Recuva, PhotoRec, etc.)" -ForegroundColor White
}
else {
    Write-Host "Total Broken Tales actors found: $totalActors" -ForegroundColor Green
    Write-Host ""
    Write-Host "To recover these actors:" -ForegroundColor Yellow
    Write-Host "  1. Open Foundry VTT" -ForegroundColor White
    Write-Host "  2. Load one of the worlds listed above" -ForegroundColor White
    Write-Host "  3. Go to Actors tab" -ForegroundColor White
    Write-Host "  4. Right-click each actor > Export Data" -ForegroundColor White
    Write-Host "  5. Save JSON files to restore your compendiums" -ForegroundColor White
    Write-Host ""
    Write-Host "Or run the export script (if available) to automate this." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
