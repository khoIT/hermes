# pre-demo-warmup.ps1
# Pre-warms Hermes catalog-api + query-svc caches before a live demo to flush
# cold-start retry tails and ensure all endpoints respond within SLA.
#
# Usage:
#   .\scripts\pre-demo-warmup.ps1
#   .\scripts\pre-demo-warmup.ps1 -CatalogUrl http://localhost:3001 -QueryUrl http://localhost:3002
#   .\scripts\pre-demo-warmup.ps1 -Reset      # also clears rehearsal litter from DB
#
# Run this ~30s before the demo starts with both services already up.
# All probes should report OK. Any FAIL needs investigation before demo.
#
# -Reset runs `pnpm --filter @hermes/catalog-api db:reset-demo` which deletes
# board_cards / campaigns / segments tagged with thread-demo-livops-2026.
# It does NOT clear browser localStorage — open in incognito or use the
# Restart-demo chip in the demo thread T1 header for a fresh client state.

param(
  [string]$CatalogUrl = 'http://localhost:3001',
  [string]$QueryUrl   = 'http://localhost:3002',
  [switch]$Reset
)

$ErrorActionPreference = 'Continue'

function Probe {
  param(
    [string]$Label,
    [string]$Method = 'GET',
    [string]$Url,
    [string]$Body = $null,
    [string]$Token = $null
  )

  $start = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }

    $params = @{
      Uri             = $Url
      Method          = $Method
      TimeoutSec      = 8
      UseBasicParsing = $true
      Headers         = $headers
    }
    if ($Body) {
      $params.Body = $Body
      $params.ContentType = 'application/json'
    }
    $resp = Invoke-WebRequest @params
    $start.Stop()
    $ms = $start.ElapsedMilliseconds
    $status = $resp.StatusCode
    if ($status -ge 200 -and $status -lt 300) {
      Write-Host "  [OK]   $Label  ${ms}ms  (HTTP $status)" -ForegroundColor Green
    } else {
      Write-Host "  [FAIL] $Label  ${ms}ms  (HTTP $status)" -ForegroundColor Red
    }
  } catch {
    $start.Stop()
    $ms = $start.ElapsedMilliseconds
    Write-Host "  [FAIL] $Label  ${ms}ms  ($($_.Exception.Message))" -ForegroundColor Red
  }
}

function Get-DevToken {
  param([string]$BaseUrl)
  try {
    $resp = Invoke-WebRequest `
      -Uri "$BaseUrl/api/v1/auth/dev-login" `
      -Method POST `
      -Body '{}' `
      -ContentType 'application/json' `
      -TimeoutSec 8 `
      -UseBasicParsing
    $data = $resp.Content | ConvertFrom-Json
    return $data.token
  } catch {
    Write-Host "  [FAIL] dev-login  ($($_.Exception.Message))" -ForegroundColor Red
    return $null
  }
}

# Demo segment predicate for audience/count probe (query-svc on :3002)
# Format: { predicate: AST, limit }. Ops: gt|lt|gte|lte|eq|in. See audience-live.ts.
$DemoSegmentBody = @'
{
  "predicate": {
    "leaf": { "feature": "consecutive_ranked_losses_streak", "op": "gte", "value": 5 }
  },
  "limit": 100
}
'@

Write-Host ""
Write-Host "Hermes pre-demo warmup" -ForegroundColor Cyan
Write-Host "  catalog-api: $CatalogUrl"
Write-Host "  query-svc:   $QueryUrl"
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

# Step 0 (optional): reset demo-thread artifacts in Postgres
if ($Reset) {
  Write-Host "  Resetting demo-thread artifacts in DB..." -ForegroundColor Yellow
  $resetStart = [System.Diagnostics.Stopwatch]::StartNew()
  & pnpm --filter '@hermes/catalog-api' db:reset-demo
  $resetStart.Stop()
  if ($LASTEXITCODE -eq 0) {
    Write-Host "  [OK]   db:reset-demo  $($resetStart.ElapsedMilliseconds)ms" -ForegroundColor Green
  } else {
    Write-Host "  [FAIL] db:reset-demo  exit $LASTEXITCODE" -ForegroundColor Red
  }
  Write-Host ""
}

# Step 1: get dev token for authenticated catalog-api probes
$token = Get-DevToken -BaseUrl $CatalogUrl
if (-not $token) {
  Write-Host "  [WARN] no token, auth-required probes will 401" -ForegroundColor Yellow
}

# Step 2: probes
Probe -Label "Feature catalog      " -Url "$CatalogUrl/api/v1/features"                                   -Token $token
Probe -Label "Audience count       " -Method POST -Url "$QueryUrl/api/v1/audience/count" -Body $DemoSegmentBody
Probe -Label "Segments list        " -Url "$CatalogUrl/api/v1/segments"                                   -Token $token
Probe -Label "Campaigns list       " -Url "$CatalogUrl/api/v1/campaigns"                                  -Token $token
Probe -Label "Boards list          " -Url "$CatalogUrl/api/v1/boards"                                     -Token $token

Write-Host ""
Write-Host "Warmup complete. All OK = ready for demo." -ForegroundColor Cyan
Write-Host ""
