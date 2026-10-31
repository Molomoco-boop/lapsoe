# Regenera la portada impactante (caché). Ejecutar con la API en marcha.
# Puedes programarlo en el Programador de tareas de Windows cada noche.

$ErrorActionPreference = "Stop"
$url = "http://127.0.0.1:8000/api/highlights/refresh"
Write-Host "Refreshing highlights via $url ..."
$res = Invoke-RestMethod -Method POST -Uri $url -TimeoutSec 180
$res | ConvertTo-Json -Depth 5
Write-Host "Done."
