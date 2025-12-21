# Broken Tales - Fix DB Files Script
# Converts "data" to "system" and fixes opposition levels and wounds structure

Write-Host "Broken Tales | Fixing .db Files" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

$dbFiles = Get-ChildItem -Path "..\packs\actors" -Filter "*.db" -File

$totalFixed = 0
foreach ($file in $dbFiles) {
    Write-Host "Processing: $($file.Name)" -ForegroundColor Yellow
    
    # Read file content
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Count changes
    $changes = 0
    
    # Replace "data": with "system":
    $originalContent = $content
    $content = $content -replace '(\r?\n\s*)"data":\s*\{', '$1"system": {'
    if ($content -ne $originalContent) {
        $dataToSystemChanges = ([regex]::Matches($originalContent, '"data":\s*\{')).Count
        Write-Host "  - Changed $dataToSystemChanges instances of 'data' to 'system'" -ForegroundColor Green
        $changes += $dataToSystemChanges
    }
    
    # Fix Opposition Level string to number
    $originalContent = $content
    $content = $content -replace '"oppositionLevel":\s*"Easy"', '"oppositionLevel": 3'
    $content = $content -replace '"oppositionLevel":\s*"Medium"', '"oppositionLevel": 5'
    $content = $content -replace '"oppositionLevel":\s*"Normal"', '"oppositionLevel": 5'
    $content = $content -replace '"oppositionLevel":\s*"Hard"', '"oppositionLevel": 7'
    if ($content -ne $originalContent) {
        Write-Host "  - Fixed opposition levels to numbers" -ForegroundColor Green
        $changes++
    }
    
    # Fix wounds structure - current should be 0, extra should be object
    $originalContent = $content
    $content = $content -replace '"current":\s*\d+,(\r?\n\s*)"extra":\s*\d+', '"current": 0,$1"extra": { "value": 0, "max": 1 }'
    if ($content -ne $originalContent) {
        Write-Host "  - Fixed wounds structure" -ForegroundColor Green
        $changes++
    }
    
    # Save file if changes were made
    if ($changes -gt 0) {
        $content | Set-Content $file.FullName -Encoding UTF8 -NoNewline
        Write-Host "  ✓ Saved with $changes change(s)" -ForegroundColor Green
        $totalFixed++
    }
    else {
        Write-Host "  ✓ No changes needed" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Fixed $totalFixed file(s)" -ForegroundColor Green
Write-Host ""
Write-Host "Changes made:" -ForegroundColor Yellow
Write-Host "  1. Replaced 'data' with 'system' (Foundry v10+ standard)" -ForegroundColor White
Write-Host "  2. Fixed oppositionLevel to numbers (3=Easy, 5=Normal, 7=Hard)" -ForegroundColor White
Write-Host "  3. Fixed wounds structure (current=0, extra as object)" -ForegroundColor White
Write-Host ""
