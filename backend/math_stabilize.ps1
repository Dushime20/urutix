
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Mathematically Stabilizing arrivals for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # Calculate depth relative to src
    $relPath = Resolve-Path $f.FullName -Relative -RelativeBasePath $srcDir
    # Remove leading .\
    if ($relPath.StartsWith(".\")) { $relPath = $relPath.Substring(2) }
    
    $parts = $relPath -split "[\\/]"
    $depth = $parts.Count - 1
    
    # Target folders
    $targets = @("entities", "common", "modules", "services")
    
    foreach ($t in $targets) {
        # Check if the file is IN the target folder (depth 1 and starts with folder name)
        # OR if it's deeper.
        $targetPrefix = ""
        if ($parts[0] -eq $t) {
            # File is inside the target folder or subfolders thereof
            $nestedDepth = $depth - 1
            if ($nestedDepth -eq 0) {
                $targetPrefix = "./"
            } else {
                for ($i = 0; $i < $nestedDepth; $i++) { $targetPrefix += "../" }
                $targetPrefix += "./" # Sibling or internal? No, just the prefix.
            }
        } else {
            # File is outside the target folder
            for ($i = 0; $i < $depth; $i++) { $targetPrefix += "../" }
            $targetPrefix += "$t/"
        }
        
        # Now replace any @target with the calculated prefix
        $re = "(['""])@$t/"
        $sub = "$1$targetPrefix"
        $newContent = [regex]::Replace($content, $re, $sub)
        if ($newContent -ne $content) { $content = $newContent; $mod = $true }
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Depth-Precision Fixed ($depth): $($f.FullName)"
    }
}
