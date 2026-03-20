
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Scrutinizing $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # 1. Global Scrub of @ aliases
    if ($content.Contains("@entities/")) { $content = $content.Replace("@entities/", "../../entities/"); $mod = $true }
    if ($content.Contains("@common/")) { $content = $content.Replace("@common/", "../../common/"); $mod = $true }
    if ($content.Contains("@services/")) { $content = $content.Replace("@services/", "../../services/"); $mod = $true }
    if ($content.Contains("@modules/")) { $content = $content.Replace("@modules/", "../../modules/"); $mod = $true }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Scrubbed @ in: $($f.FullName)"
    }
}

# 2. Fix common depth in subfolders (Precision Strip)
$subfolders = @("services", "controllers", "guards", "strategies")
foreach ($s in $subfolders) {
    $files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts" | Where-Object { $PSItem.DirectoryName -match "\\$s$" }
    
    foreach ($f in $files) {
        $c = [System.IO.File]::ReadAllText($f.FullName)
        $mod = $false
        
        if ($c.Contains("'../../entities/")) { $c = $c.Replace("'../../entities/", "'../../../entities/"); $mod=$true }
        if ($c.Contains("'../../common/")) { $c = $c.Replace("'../../common/", "'../../../common/"); $mod=$true }
        if ($c.Contains("'../../services/")) { $c = $c.Replace("'../../services/", "'../../../services/"); $mod=$true }
        if ($c.Contains("'../../modules/")) { $c = $c.Replace("'../../modules/", "'../../../modules/"); $mod=$true }

        if ($c.Contains("""../../entities/")) { $c = $c.Replace("""../../entities/", """../../../entities/"); $mod=$true }
        if ($c.Contains("""../../common/")) { $c = $c.Replace("""../../common/", """../../../common/"); $mod=$true }

        if ($mod) {
            [System.IO.File]::WriteAllText($f.FullName, $c)
            Write-Host "Norm-Depth in: $($f.FullName)"
        }
    }
}
