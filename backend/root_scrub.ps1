
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Scrubbing to root-relative for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # Normalize ANY relative import to entities/ common/ etc to src/entities/ common/
    if ($content -match "(['""])@(entities|common|modules|services)/") {
        $content = [regex]::Replace($content, "(['""])@(entities|common|modules|services)/", "$1src/$2/")
        $mod = $true
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Root-Relative in: $($f.FullName)"
    }
}
