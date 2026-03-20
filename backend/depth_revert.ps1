
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Smart Reverting imports for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # Calculate depth relative to src
    $relPath = Resolve-Path $f.FullName -Relative -RelativeBasePath $srcDir
    $depth = ($relPath -split "[\\/]").Count - 1
    
    # Calculate correct prefix (../ based on depth)
    $prefix = ""
    for ($i = 0; $i < $depth; $i++) { $prefix += "../" }
    
    # Replace root-relative src/ imports with calculated relative ones
    if ($content -match "(['""])src/(entities|common|modules|services)/") {
        $re = "(['""])src/(entities|common|modules|services)/"
        $sub = "$1$prefix$2/"
        $content = [regex]::Replace($content, $re, $sub)
        $mod = $true
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Fixed Relative in ($depth depth): $($f.FullName)"
    }
}
