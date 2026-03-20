
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Repairing quotes for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # 1. Target: 'from' followed by No Quote
    # Matches 'from ../' but NOT 'from "../'
    # Pattern: from\s+([^\s'"][\w\.\-/]+)(;|\n)
    if ($content -match "from\s+([^\s'""].+);") {
        $content = [regex]::Replace($content, "from\s+([^\s'""][\w\.\-/]+);", "from '$1';")
        $mod = $true
    }
    
    # 2. Fix the globs that got '@/' (like in database.config)
    # If the string was '@/**/*.entity.ts' (the leading quote was replaced by @)
    if ($content -match "@(/\w.*\.ts)") {
       $content = [regex]::Replace($content, "@(/[\w\*/\.\-]+\.ts)", "'src$1")
       $mod = $true
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Repaired: $($f.FullName)"
    }
}
