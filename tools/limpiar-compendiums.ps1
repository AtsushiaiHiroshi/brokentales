# Script de Limpieza de Compendiums - Broken Tales
# Este script elimina archivos .db viejos y carpetas incorrectas

Write-Host "=== LIMPIEZA DE COMPENDIUMS - BROKEN TALES ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"
$deletedItems = 0
$errors = 0

# 1. Eliminar archivos .db viejos de packs/actors/
Write-Host "1. Eliminando archivos .db viejos de packs/actors/..." -ForegroundColor Yellow
$oldDbFiles = @(
    "packs\actors\Adversaries.db",
    "packs\actors\Broken Ones.db",
    "packs\actors\Creatures.db",
    "packs\actors\Dark Presences.db",
    "packs\actors\Pre-Generated Hunters.db",
    "packs\actors\Scenario Gifts.db",
    "packs\actors\Villager.db"
)

foreach ($file in $oldDbFiles) {
    $fullPath = Join-Path $PSScriptRoot "..\$file"
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Force
            Write-Host "   ✓ Eliminado: $file" -ForegroundColor Green
            $deletedItems++
        }
        catch {
            Write-Host "   ✗ Error eliminando: $file - $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    }
    else {
        Write-Host "   - No existe: $file" -ForegroundColor Gray
    }
}

Write-Host ""

# 2. Eliminar carpetas de tipos consolidados (vacías o con LevelDB interno)
Write-Host "2. Eliminando carpetas de tipos consolidados..." -ForegroundColor Yellow
$oldFolders = @(
    "packs\compendiums\actors\broken-ones",
    "packs\compendiums\actors\creatures",
    "packs\compendiums\actors\villagers",
    "packs\compendiums\actors\threats",
    "packs\compendiums\actors\adversaries",
    "packs\compendiums\actors\pre-generated-npcs",
    "packs\compendiums\scenario-gifts\scenario-gifts"
)

foreach ($folder in $oldFolders) {
    $fullPath = Join-Path $PSScriptRoot "..\$folder"
    if (Test-Path $fullPath) {
        try {
            Remove-Item $fullPath -Recurse -Force
            Write-Host "   ✓ Eliminado: $folder" -ForegroundColor Green
            $deletedItems++
        }
        catch {
            Write-Host "   ✗ Error eliminando: $folder - $($_.Exception.Message)" -ForegroundColor Red
            $errors++
        }
    }
    else {
        Write-Host "   - No existe: $folder" -ForegroundColor Gray
    }
}

Write-Host ""

# 3. Verificar estructura correcta
Write-Host "3. Verificando estructura de compendiums por escenario..." -ForegroundColor Yellow
$scenarios = @(
    "red-hood-iskra",
    "ozena-the-suffering-and-desperate",
    "wonderbedlam",
    "the-city-of-pigs",
    "the-smile-in-the-darkness",
    "tuvstarrs-reflection",
    "of-flesh-and-wood",
    "saint-george-the-dragon-slayer",
    "one-thousand-and-one-nightmares",
    "a-soldiers-duty"
)

$allGood = $true
foreach ($scenario in $scenarios) {
    $scenarioPath = Join-Path $PSScriptRoot "..\packs\compendiums\actors\$scenario"
    if (Test-Path $scenarioPath) {
        $dbFiles = Get-ChildItem -Path $scenarioPath -Filter "*.db" -File
        if ($dbFiles.Count -gt 0) {
            Write-Host "   ✓ $scenario - $($dbFiles.Count) archivo(s) .db encontrado(s)" -ForegroundColor Green
        }
        else {
            Write-Host "   ⚠ $scenario - No se encontraron archivos .db" -ForegroundColor Yellow
            $allGood = $false
        }
    }
    else {
        Write-Host "   ✗ $scenario - Carpeta no existe" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""

# Resumen
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Items eliminados: $deletedItems" -ForegroundColor $(if ($deletedItems -gt 0) { "Green" } else { "Gray" })
Write-Host "Errores: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "Estructura correcta: $(if ($allGood) { 'SÍ' } else { 'NO - Verifica los warnings arriba' })" -ForegroundColor $(if ($allGood) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "=== PRÓXIMOS PASOS ===" -ForegroundColor Cyan
Write-Host "1. Reinicia Foundry VTT completamente" -ForegroundColor White
Write-Host "2. Verifica que los compendiums se carguen correctamente" -ForegroundColor White
Write-Host "3. Comprueba que están organizados por escenario" -ForegroundColor White
Write-Host ""
Write-Host "¡Listo!" -ForegroundColor Green
