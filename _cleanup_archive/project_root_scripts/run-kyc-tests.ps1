#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Comprehensive KYC Test Suite Runner for UrutiX Platform

.DESCRIPTION
    This script runs comprehensive integration, performance, and security tests
    for the KYC (Know Your Customer) verification system.

.PARAMETER TestType
    Specifies which type of tests to run: All, Integration, Performance, Security

.PARAMETER ExitOnFailure
    Exit with error code if any tests fail

.PARAMETER NoReport
    Skip generating the comprehensive test report

.PARAMETER Verbose
    Enable verbose output for debugging

.EXAMPLE
    .\run-kyc-tests.ps1
    Runs all KYC tests with default settings

.EXAMPLE
    .\run-kyc-tests.ps1 -TestType Integration -ExitOnFailure
    Runs only integration tests and exits on failure

.EXAMPLE
    .\run-kyc-tests.ps1 -TestType Security -Verbose
    Runs only security tests with verbose output
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("All", "Integration", "Performance", "Security")]
    [string]$TestType = "All",
    
    [Parameter(Mandatory=$false)]
    [switch]$ExitOnFailure,
    
    [Parameter(Mandatory=$false)]
    [switch]$NoReport,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose
)

# Script configuration
$ErrorActionPreference = "Stop"
$BackendPath = Join-Path $PSScriptRoot "urutix\backend"
$LogFile = Join-Path $PSScriptRoot "kyc-test-results.log"

# Colors for output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Cyan"
    Header = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Colors[$Color]
}

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-ColorOutput "=" * 80 -Color Header
    Write-ColorOutput $Title -Color Header
    Write-ColorOutput "=" * 80 -Color Header
    Write-Host ""
}

function Test-Prerequisites {
    Write-ColorOutput "🔍 Checking prerequisites..." -Color Info
    
    # Check if Node.js is installed
    try {
        $nodeVersion = node --version
        Write-ColorOutput "✅ Node.js version: $nodeVersion" -Color Success
    } catch {
        Write-ColorOutput "❌ Node.js is not installed or not in PATH" -Color Error
        throw "Node.js is required to run the tests"
    }
    
    # Check if npm is installed
    try {
        $npmVersion = npm --version
        Write-ColorOutput "✅ npm version: $npmVersion" -Color Success
    } catch {
        Write-ColorOutput "❌ npm is not installed or not in PATH" -Color Error
        throw "npm is required to run the tests"
    }
    
    # Check if backend directory exists
    if (-not (Test-Path $BackendPath)) {
        Write-ColorOutput "❌ Backend directory not found: $BackendPath" -Color Error
        throw "Backend directory is required"
    }
    
    # Check if test files exist
    $testFiles = @(
        "test-tenant-kyc-integration.js",
        "test-kyc-performance.js", 
        "test-kyc-security.js",
        "run-kyc-test-suite.js"
    )
    
    foreach ($file in $testFiles) {
        $filePath = Join-Path $BackendPath $file
        if (-not (Test-Path $filePath)) {
            Write-ColorOutput "❌ Test file not found: $file" -Color Error
            throw "Required test file is missing: $file"
        }
    }
    
    Write-ColorOutput "✅ All prerequisites met" -Color Success
}

function Start-Backend {
    Write-ColorOutput "🚀 Starting backend server..." -Color Info
    
    # Check if backend is already running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✅ Backend server is already running" -Color Success
            return $true
        }
    } catch {
        # Backend is not running, continue to start it
    }
    
    # Start backend in background
    Push-Location $BackendPath
    try {
        $backendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "start:dev" -PassThru -WindowStyle Hidden
        
        # Wait for backend to start (max 30 seconds)
        $timeout = 30
        $elapsed = 0
        
        while ($elapsed -lt $timeout) {
            Start-Sleep -Seconds 2
            $elapsed += 2
            
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -TimeoutSec 5 -ErrorAction SilentlyContinue
                if ($response.StatusCode -eq 200) {
                    Write-ColorOutput "✅ Backend server started successfully" -Color Success
                    return $true
                }
            } catch {
                # Continue waiting
            }
            
            Write-ColorOutput "⏳ Waiting for backend to start... ($elapsed/$timeout seconds)" -Color Info
        }
        
        Write-ColorOutput "❌ Backend server failed to start within $timeout seconds" -Color Error
        return $false
    } finally {
        Pop-Location
    }
}

function Invoke-KycTests {
    param([string]$Type)
    
    Write-Header "RUNNING KYC TESTS - $Type"
    
    Push-Location $BackendPath
    try {
        $arguments = @("run-kyc-test-suite.js")
        
        # Add test type specific arguments
        switch ($Type) {
            "Integration" { $arguments += "--integration-only" }
            "Performance" { $arguments += "--performance-only" }
            "Security" { $arguments += "--security-only" }
        }
        
        # Add optional arguments
        if ($ExitOnFailure) { $arguments += "--exit-on-failure" }
        if ($NoReport) { $arguments += "--no-report" }
        
        # Run the tests
        $process = Start-Process -FilePath "node" -ArgumentList $arguments -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            Write-ColorOutput "✅ $Type tests completed successfully" -Color Success
            return $true
        } else {
            Write-ColorOutput "❌ $Type tests failed with exit code: $($process.ExitCode)" -Color Error
            return $false
        }
    } catch {
        Write-ColorOutput "❌ Error running $Type tests: $($_.Exception.Message)" -Color Error
        return $false
    } finally {
        Pop-Location
    }
}

function Save-TestResults {
    param([hashtable]$Results)
    
    Write-ColorOutput "💾 Saving test results to log file..." -Color Info
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logContent = @"
KYC Test Suite Results - $timestamp
$("=" * 50)
Test Type: $TestType
Exit on Failure: $ExitOnFailure
Generate Report: $(-not $NoReport)

Results:
"@
    
    foreach ($test in $Results.Keys) {
        $status = if ($Results[$test]) { "PASSED" } else { "FAILED" }
        $logContent += "`n$test`: $status"
    }
    
    $logContent += "`n`nTest completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    
    try {
        $logContent | Out-File -FilePath $LogFile -Encoding UTF8 -Append
        Write-ColorOutput "✅ Test results saved to: $LogFile" -Color Success
    } catch {
        Write-ColorOutput "⚠️ Failed to save test results: $($_.Exception.Message)" -Color Warning
    }
}

function Show-TestSummary {
    param([hashtable]$Results)
    
    Write-Header "TEST SUMMARY"
    
    $totalTests = $Results.Count
    $passedTests = ($Results.Values | Where-Object { $_ -eq $true }).Count
    $failedTests = $totalTests - $passedTests
    $successRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 1) } else { 0 }
    
    Write-ColorOutput "📊 Overall Results:" -Color Info
    Write-ColorOutput "   Total Test Suites: $totalTests" -Color Info
    Write-ColorOutput "   Passed: $passedTests ✅" -Color Success
    Write-ColorOutput "   Failed: $failedTests ❌" -Color $(if ($failedTests -eq 0) { "Success" } else { "Error" })
    Write-ColorOutput "   Success Rate: $successRate%" -Color $(if ($successRate -eq 100) { "Success" } elseif ($successRate -ge 80) { "Warning" } else { "Error" })
    
    Write-Host ""
    Write-ColorOutput "📋 Detailed Results:" -Color Info
    foreach ($test in $Results.Keys) {
        $status = if ($Results[$test]) { "✅ PASSED" } else { "❌ FAILED" }
        $color = if ($Results[$test]) { "Success" } else { "Error" }
        Write-ColorOutput "   $test`: $status" -Color $color
    }
    
    if ($failedTests -eq 0) {
        Write-Host ""
        Write-ColorOutput "🎉 All tests passed! The KYC system is ready for deployment." -Color Success
    } else {
        Write-Host ""
        Write-ColorOutput "⚠️ Some tests failed. Please review the results and fix issues before deployment." -Color Warning
    }
}

# Main execution
try {
    Write-Header "KYC COMPREHENSIVE TEST SUITE"
    
    Write-ColorOutput "🧪 Test Configuration:" -Color Info
    Write-ColorOutput "   Test Type: $TestType" -Color Info
    Write-ColorOutput "   Exit on Failure: $ExitOnFailure" -Color Info
    Write-ColorOutput "   Generate Report: $(-not $NoReport)" -Color Info
    Write-ColorOutput "   Verbose Output: $Verbose" -Color Info
    
    # Check prerequisites
    Test-Prerequisites
    
    # Start backend if needed
    $backendStarted = Start-Backend
    if (-not $backendStarted) {
        throw "Failed to start backend server"
    }
    
    # Run tests based on type
    $testResults = @{}
    
    switch ($TestType) {
        "All" {
            $testResults["Integration"] = Invoke-KycTests "Integration"
            $testResults["Performance"] = Invoke-KycTests "Performance"
            $testResults["Security"] = Invoke-KycTests "Security"
        }
        "Integration" {
            $testResults["Integration"] = Invoke-KycTests "Integration"
        }
        "Performance" {
            $testResults["Performance"] = Invoke-KycTests "Performance"
        }
        "Security" {
            $testResults["Security"] = Invoke-KycTests "Security"
        }
    }
    
    # Save results and show summary
    Save-TestResults $testResults
    Show-TestSummary $testResults
    
    # Exit with appropriate code
    $hasFailures = $testResults.Values -contains $false
    if ($ExitOnFailure -and $hasFailures) {
        Write-ColorOutput "❌ Exiting with error code due to test failures" -Color Error
        exit 1
    } elseif ($hasFailures) {
        Write-ColorOutput "⚠️ Tests completed with some failures" -Color Warning
        exit 0
    } else {
        Write-ColorOutput "✅ All tests completed successfully" -Color Success
        exit 0
    }
    
} catch {
    Write-ColorOutput "💥 Test suite execution failed: $($_.Exception.Message)" -Color Error
    
    if ($Verbose) {
        Write-ColorOutput "Stack trace:" -Color Error
        Write-ColorOutput $_.Exception.StackTrace -Color Error
    }
    
    exit 1
}