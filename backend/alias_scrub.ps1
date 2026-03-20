
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Re-aliasing $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # Normalize ANY relative import to entities/ to @entities/
    # This matches '..', '../..', './', etc.
    if ($content -match "\.{1,2}/(entities|common|modules|services)/") {
        $content = [regex]::Replace($content, "(['""])\.{1,2}(/\.\.){0,}/(entities|common|modules|services)/", "$1@$3/")
        $mod = $true
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Aliased in: $($f.FullName)"
    }
}
