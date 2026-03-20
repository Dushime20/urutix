
$srcDir = "C:\Users\HP\Desktop\urutix\urutix\backend\src"
$files = Get-ChildItem -Path $srcDir -Recurse -File -Include "*.ts"
Write-Host "Re-Architecting project for $($files.Count) files..."

foreach ($f in $files) {
    if ($f.FullName -match "__tests__") { continue }
    $content = [System.IO.File]::ReadAllText($f.FullName)
    $mod = $false

    # 1. First, fix the broken Pattern '@/'
    # Map any '@/' to '@entities/' as those were the broken ones
    if ($content.Contains("'@/")) { $content = $content.Replace("'@/", "'@entities/"); $mod = $true }
    if ($content.Contains("""@/")) { $content = $content.Replace("""@/", """@entities/"); $mod = $true }

    # 2. Next, re-alias any relative dots like ../../entities/ to @entities/
    if ($content -match "(['""])\.{1,2}(/\.\.){0,}/(entities|common|modules|services)/") {
        $content = [regex]::Replace($content, "(['""])\.{1,2}(/\.\.){0,}/(entities|common|modules|services)/", "$1@$3/")
        $mod = $true
    }

    if ($mod) {
        [System.IO.File]::WriteAllText($f.FullName, $content)
        Write-Host "Stabilized: $($f.FullName)"
    }
}
