# Lapsoe Machinery — Transparencia del dinero público (España)

Portal de investigación sobre contratos, subvenciones y encargos públicos.
**Sin orientación partidista. Sin datos inventados.**

- Plan / infra: [`PLAN.md`](./PLAN.md)
- Auditoría de fuentes: [`walkthrough.md`](./walkthrough.md)
- **Gratis + PC apagado:** [`deploy/CLOUD_FREE.md`](./deploy/CLOUD_FREE.md) (GitHub Pages + Cloudflare Worker)
- DuckDNS (solo si el PC está encendido): [`deploy/`](./deploy/)

## Arranque local

```powershell
# API
cd backend
$env:PYTHONPATH = (Get-Location).Path
.\.venv\Scripts\uvicorn.exe app.main:app --reload --host 127.0.0.1 --port 8000

# Web
cd frontend
npm run dev
```

- Web: http://localhost:3000  
- API docs: http://127.0.0.1:8000/docs  

## Publicar en DuckDNS

1. Crea un subdominio gratis en [duckdns.org](https://www.duckdns.org/) y copia el **token**.
2. Copia `deploy/.env.duckdns.example` → `deploy/.env.duckdns` y rellena:
   ```
   DUCKDNS_SUBDOMAIN=tu-nombre
   DUCKDNS_TOKEN=tu-token-uuid
   ```
3. En el router, reenvía **TCP 80 y 443** a la IP local de este PC.
4. Ejecuta:
   ```powershell
   cd deploy
   .\start-public.ps1
   ```
5. Abre `https://tu-nombre.duckdns.org`

Sin subdomain + token **no se puede completar el DNS**. Sin reenvío 80/443 el certificado HTTPS de Caddy fallará.

## Secciones

| Ruta | Contenido |
|:---|:---|
| `/` | Portada + metadatos oficiales en vivo |
| `/contratos` | Feed PLACSP + muestra local + CSV |
| `/subvenciones` | BDNS en vivo + CSV |
| `/encargos` | Feed EMP |
| `/fondos-europeos` | MRR BDNS + stub AIReF |
| `/empresas/[nif]` | Ficha por NIF exacto |
| `/investigaciones` | Motor descriptivo + alertas |
| `/cobertura` | Mapa y conectores CCAA |
| `/estado` | sync_runs reales |
| `/metodologia` | Fuentes y límites |
| `/buscar` | Buscador global |

## Arquitectura cloud (recomendado: gratis, PC apagado OK)

```
GitHub Pages (HTML)  →  portada desde frontend/public/highlights.json
Cloudflare Worker    →  proxy en vivo BDNS / PLACSP (sin CORS)
GitHub Actions       →  refresca highlights a diario
```

```powershell
# Una vez: logins + crear repo + deploy Worker
powershell -ExecutionPolicy Bypass -File deploy\login-and-push.ps1
```

Detalle: [`deploy/CLOUD_FREE.md`](./deploy/CLOUD_FREE.md).

## Arquitectura local / DuckDNS

- **Portada:** caché en `frontend/public/highlights.json` (o API local).
- **Navegación:** BDNS/PLACSP en vivo.
- **DuckDNS:** solo DNS. Si apagas el PC, la web **cae**.

```powershell
# Regenerar portada (API local)
Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:8000/api/highlights/refresh"
# o CI-compatible sin FastAPI:
python scripts\build_highlights_ci.py
```

## Ingesta smoke (acotada)

```powershell
Invoke-RestMethod -Method POST -Uri "http://127.0.0.1:8000/api/ingest/smoke?limit=40"
```
