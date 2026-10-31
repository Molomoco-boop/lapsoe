# Ejecuta ESTO tú (abre navegadores de login). No lo automatiza el agente.
# Uso:  powershell -ExecutionPolicy Bypass -File deploy\login-and-push.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "== 1) GitHub login ==" -ForegroundColor Cyan
gh auth login

Write-Host "== 2) Cloudflare Worker login + deploy ==" -ForegroundColor Cyan
Set-Location "$Root\worker"
npm install
npx wrangler login
npx wrangler deploy
Write-Host "Copia la URL *.workers.dev que imprime wrangler." -ForegroundColor Yellow

Set-Location $Root
$worker = Read-Host "Pega la URL del Worker (sin /api al final)"
$apiBase = ($worker.TrimEnd("/") + "/api")

Write-Host "== 3) Crear repo y subir ==" -ForegroundColor Cyan
$repoName = Read-Host "Nombre del repo (ej. lapsoe-machinery)"
gh repo create $repoName --public --source=. --remote=origin --push

$user = gh api user --jq .login
$raw = "https://raw.githubusercontent.com/$user/$repoName/main/frontend/public/highlights.json"
Write-Host "Actualiza worker/wrangler.toml HIGHLIGHTS_URL a:`n  $raw" -ForegroundColor Yellow
Write-Host "Luego: cd worker; npx wrangler deploy" -ForegroundColor Yellow

Write-Host "== 4) Variables de Actions ==" -ForegroundColor Cyan
gh variable set NEXT_PUBLIC_API_BASE --body $apiBase --repo "$user/$repoName"
gh variable set NEXT_PUBLIC_BASE_PATH --body "/$repoName" --repo "$user/$repoName"

Write-Host "== 5) Activar Pages ==" -ForegroundColor Cyan
Write-Host "En GitHub: Settings → Pages → Source: GitHub Actions"
Write-Host "Luego: Actions → Deploy static site → Run workflow"
Write-Host "URL: https://$user.github.io/$repoName/"
Write-Host "Listo. Detalle en deploy/CLOUD_FREE.md"
