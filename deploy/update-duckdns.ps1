param(
  [string]$EnvFile = (Join-Path $PSScriptRoot ".env.duckdns")
)

if (-not (Test-Path $EnvFile)) {
  Write-Error "Missing deploy/.env.duckdns"
  exit 1
}

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_ -split '=', 2
  if ($parts.Count -lt 2) { return }
  Set-Item -Path ("Env:" + $parts[0].Trim()) -Value $parts[1].Trim()
}

if (-not $env:DUCKDNS_SUBDOMAIN -or -not $env:DUCKDNS_TOKEN) {
  Write-Error "DUCKDNS_SUBDOMAIN and DUCKDNS_TOKEN required"
  exit 1
}

$sub = $env:DUCKDNS_SUBDOMAIN
$tok = $env:DUCKDNS_TOKEN
$url = "https://www.duckdns.org/update?domains=${sub}&token=${tok}&ip="
$res = & curl.exe -s -- $url
Write-Host "DuckDNS update (${sub}.duckdns.org): $res"
if ($res -ne "OK") { exit 2 }
