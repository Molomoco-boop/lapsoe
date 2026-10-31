# Arranca OBSERVATORIO detrás de Caddy en tu dominio DuckDNS.
# Requisitos:
#   1) deploy/.env.duckdns con DUCKDNS_SUBDOMAIN y DUCKDNS_TOKEN
#   2) Router: reenviar TCP 80 y 443 a este PC
#   3) Firewall Windows: permitir Caddy en 80/443 (el script lo intenta)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$EnvFile = Join-Path $PSScriptRoot ".env.duckdns"
$Caddyfile = Join-Path $PSScriptRoot "Caddyfile"
$Logs = Join-Path $PSScriptRoot "logs"
New-Item -ItemType Directory -Force -Path $Logs | Out-Null

if (-not (Test-Path $EnvFile)) {
  Copy-Item (Join-Path $PSScriptRoot ".env.duckdns.example") $EnvFile
  Write-Host "Creado $EnvFile — edítalo con tu subdomain y token de https://www.duckdns.org/ y vuelve a ejecutar."
  exit 1
}

Get-Content $EnvFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $k, $v = $_ -split '=', 2
  Set-Item -Path "Env:$($k.Trim())" -Value $v.Trim()
}

$sub = $env:DUCKDNS_SUBDOMAIN
$token = $env:DUCKDNS_TOKEN
$fePort = if ($env:FRONTEND_PORT) { $env:FRONTEND_PORT } else { "3000" }
$bePort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } else { "8000" }
$domain = "$sub.duckdns.org"

if (-not $sub -or -not $token -or $token -like "pega-aqui*") {
  Write-Error "Configura DUCKDNS_SUBDOMAIN y DUCKDNS_TOKEN reales en deploy/.env.duckdns"
}

# 1) Actualizar DNS
& (Join-Path $PSScriptRoot "update-duckdns.ps1") -EnvFile $EnvFile

# 2) Generar Caddyfile
$tpl = Get-Content (Join-Path $PSScriptRoot "Caddyfile.template") -Raw
$cfg = $tpl.Replace('{$DOMAIN}', $domain).Replace('{$BACKEND_PORT}', $bePort).Replace('{$FRONTEND_PORT}', $fePort)
Set-Content -Path $Caddyfile -Value $cfg -Encoding UTF8
Write-Host "Caddyfile → $domain"

# 3) CORS / URL pública para Next
$env:NEXT_PUBLIC_API_BASE = "/api"
$env:CORS_ORIGINS = "https://$domain,http://$domain,http://localhost:3000"

# 4) Firewall (mejor esfuerzo)
try {
  New-NetFirewallRule -DisplayName "OBSERVATORIO Caddy HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue | Out-Null
  New-NetFirewallRule -DisplayName "OBSERVATORIO Caddy HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue | Out-Null
} catch {}

# 5) Backend (solo si no escucha ya)
$beListen = Get-NetTCPConnection -LocalPort ([int]$bePort) -State Listen -ErrorAction SilentlyContinue
if (-not $beListen) {
  $backendDir = Join-Path $Root "backend"
  $python = Join-Path $backendDir ".venv\Scripts\uvicorn.exe"
  $env:PYTHONPATH = $backendDir
  Start-Process -FilePath $python -ArgumentList "app.main:app","--host","127.0.0.1","--port",$bePort -WorkingDirectory $backendDir -WindowStyle Minimized
  Write-Host "Backend arrancado :$bePort"
} else {
  Write-Host "Backend ya activo :$bePort"
}

# 6) Frontend
$feListen = Get-NetTCPConnection -LocalPort ([int]$fePort) -State Listen -ErrorAction SilentlyContinue
if (-not $feListen) {
  $frontendDir = Join-Path $Root "frontend"
  Start-Process -FilePath "npm" -ArgumentList "run","dev","--","--port",$fePort,"--hostname","127.0.0.1" -WorkingDirectory $frontendDir -WindowStyle Minimized
  Write-Host "Frontend arrancado :$fePort"
  Start-Sleep -Seconds 5
} else {
  Write-Host "Frontend ya activo :$fePort"
}

# 7) Caddy
$caddyCmd = Get-Command caddy -ErrorAction SilentlyContinue
$caddy = if ($caddyCmd) { $caddyCmd.Source } else { $null }
if (-not $caddy) {
  $hit = Get-ChildItem "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Recurse -Filter "caddy.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($hit) { $caddy = $hit.FullName }
}
if (-not $caddy) { $caddy = "caddy" }

Write-Host "Arrancando Caddy en https://$domain ..."
Write-Host "IMPORTANTE: abre en el router los puertos 80 y 443 hacia este PC ($((curl.exe -s https://api.ipify.org)))."
& $caddy run --config $Caddyfile --adapter caddyfile
