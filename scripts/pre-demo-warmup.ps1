# pre-demo-warmup.ps1
# Pre-warms Hermes catalog-api caches before a live demo to flush cold-start
# retry tails and ensure all endpoints respond within SLA.
#
# Usage:
#   .\scripts\pre-demo-warmup.ps1
#   .\scripts\pre-demo-warmup.ps1 -BaseUrl http://localhost:3002
#
# Run this ~30s before the demo starts with catalog-api already up.
# All 5 endpoints should report OK. Any FAIL needs investigation before demo.

param(
  [string]$BaseUrl = 'http://localhost:3001'
)

$ErrorActionPreference = 'Continue'

function Probe {
  param(
    [string]$Label,
    [string]$Method = 'GET',
    [string]$Url,
    [string]$Body = $null
  )

  $start = [System.Diagnostics.Stopwatch]::StartNew()
  try {
    $params = @{
      Uri     = $Url
      Method  = $Method
      TimeoutSec = 8
      UseBasicParsing = $true
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

# Demo segment predicate for audience/count probe
$DemoSegmentBody = @'
{
  "groups": [
    {
      "op": "AND",
      "conditions": [
        { "feature": "consecutive_ranked_losses_streak", "op": ">=", "value": 5 },
        { "feature": "is_paying_user_lifetime", "op": "is_false", "value": false },
        { "feature": "iam_received_count_24h", "op": "<", "value": 1 }
      ]
    }
  ]
}
'@

Write-Host ""
Write-Host "Hermes pre-demo warmup — $BaseUrl" -ForegroundColor Cyan
Write-Host "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Host ""

Probe -Label "Feature catalog      " -Url "$BaseUrl/api/v1/features"
Probe -Label "Audience count       " -Method POST -Url "$BaseUrl/api/v1/audience/count" -Body $DemoSegmentBody
Probe -Label "Segments list        " -Url "$BaseUrl/api/v1/segments"
Probe -Label "Campaigns list       " -Url "$BaseUrl/api/v1/campaigns"
Probe -Label "Boards list          " -Url "$BaseUrl/api/v1/boards"

Write-Host ""
Write-Host "Warmup complete. All OK = ready for demo." -ForegroundColor Cyan
Write-Host ""
