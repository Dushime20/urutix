
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Purifying syntax for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # 1. Resolve Double or Triple single quotes at end of imports
    if ($content.Contains("''';")) { $content = $content.Replace("''';", "';"); $mod = $true }
    if ($content.Contains("'';")) { $content = $content.Replace("'';", "';"); $mod = $true }
    
    # 2. Resolve Double or Triple single quotes at START of imports
    if ($content.Contains("from '''")) { $content = $content.Replace("from '''", "from '"); $mod = $true }
    if ($content.Contains("from ''")) { $content = $content.Replace("from ''", "from '"); $mod = $true }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Purified: $($f.FullName)"
    }
}
