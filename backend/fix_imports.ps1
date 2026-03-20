
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Synchronizing depths for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # Calculate depth relative to src
    $relPath = Resolve-Path $f.FullName -Relative -RelativeBasePath $srcDir
    $parts = $relPath -split "[\\/]"
    $depth = $parts.Count - 1
    
    # Calculate prefix based on depth
    $prefix = ""
    for ($i = 0; $i < $depth; $i++) { $prefix = $prefix + "../" }
    
    if ($depth -eq 0) { $prefix = "./" }
    
    # Target pattern: @/
    # (Matches any single or double quote followed by @/)
    if ($content -match "(['""])@/") {
        # Replace '@/' with the calculated relative depth to the entities folder
        # (Assuming the original '@/' was meant to be the src/ root)
        $re = "(['""])@/"
        $sub = "$1$prefix"
        $content = [regex]::Replace($content, $re, $sub)
        $mod = $true
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Depth-Synced ($depth): $($f.FullName)"
    }
}
