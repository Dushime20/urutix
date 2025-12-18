# PowerShell script to configure external lender
# Admin JWT token is prefilled as provided

$adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhMzUxM2IzOC1lNDkzLTRkODUtOWU5My1iMzUxMTk2ZDFhMmUiLCJlbWFpbCI6ImFkbWluMkB1cnV0aXguY29tIiwicm9sZSI6IkFETUlOIiwidGVuYW50SWQiOiJmMzFlNzNmMi0yYzY1LTRiNmMtYjZmMS1mOWQxMTU1MDAxMmQiLCJpYXQiOjE3NjU5ODEyMTksImV4cCI6MTc2NjAzNTIxOX0.YqMkNA8Djr5znN1mONgBZYlP2pMVAmThPS-Jwfe6KL4"  # Get from browser DevTools → Application → Local Storage → accessToken

$lenderId = "2d6a9dd1-7a81-4e5a-affe-289b2dea80f8"  # Uruti Lender
$baseUrl = "http://localhost:3000"
$apiKey = "8ed97c214f68b0460993658b41139432523d9dfff1c49cf5585eaae53b6d8078"
$webhookSecret = "9e0b0a4c26638001daa309f7603d6ded6291d92a7357c9982ef0faf606284699"

$body = @{
    lenderId = $lenderId
    baseUrl = $baseUrl
    apiKey = $apiKey
    webhookSecret = $webhookSecret
    loanProductCode = "PL-001"
} | ConvertTo-Json

Write-Host "🔧 Configuring lender for external system integration..." -ForegroundColor Cyan
Write-Host "Lender ID: $lenderId"
Write-Host "Base URL: $baseUrl"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3002/api/admin/uruti-lending/configure" `
        -Method Post `
        -Headers @{
            "Authorization" = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -Body $body

    Write-Host "✅ Success! Lender configured for external system." -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Restart your backend"
    Write-Host "2. Try fetching lenders again"
    Write-Host "3. Loan officers should now appear in External Lending System tab"
} catch {
    Write-Host "❌ Error configuring lender:" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Error: $responseBody"
    } else {
        Write-Host "Error: $($_.Exception.Message)"
    }
}

