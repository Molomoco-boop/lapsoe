# Lapsoe Machinery — despliegue gratis (PC apagado OK)

## Arquitectura

```
GitHub repo
  ├── frontend/public/highlights.json  ← caché de portada (Actions diario)
  └── Worker (Cloudflare)              ← proxy en vivo BDNS/PLACSP
        ↑
GitHub Pages (HTML estático)           ← web pública
```

## Lo que necesitas (tú)

1. Cuenta **GitHub**
2. Cuenta **Cloudflare** (gratis)
3. En este PC, una vez:
   - `npx wrangler login` (abre el navegador)
   - Subir el código a GitHub (si no tienes `gh`, usa la web o GitHub Desktop)

## Pasos

### A) Cloudflare Worker

```powershell
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

Copia la URL que imprime, tipo:
`https://lapsoe-machinery-api.<subdomain>.workers.dev`

### B) Repo GitHub

1. Crea un repo público `lapsoe-machinery`
2. Sube este proyecto (sin `.env.duckdns` ni `backend/.venv`)
3. En el repo → **Settings → Pages → Source: GitHub Actions**
4. **Settings → Secrets and variables → Actions → Variables**:
   - `NEXT_PUBLIC_API_BASE` = `https://lapsoe-machinery-api.<subdomain>.workers.dev/api`
   - `NEXT_PUBLIC_BASE_PATH` = `/lapsoe-machinery` (si el sitio es `usuario.github.io/lapsoe-machinery`)
5. Edita `worker/wrangler.toml` → `HIGHLIGHTS_URL` al raw de tu repo:
   `https://raw.githubusercontent.com/<USER>/lapsoe-machinery/main/frontend/public/highlights.json`
6. Redeploy del Worker: `npx wrangler deploy`

### C) Actions

- `refresh-highlights.yml` regenera la portada cada día
- `deploy-pages.yml` publica el sitio estático

URL final típica: `https://<USER>.github.io/lapsoe-machinery/`

## DuckDNS

Con esta arquitectura **no hace falta DuckDNS** para que la web viva.
Si quieres el nombre `lapsoemachinery.duckdns.org`, habría que poner un proxy/CNAME hacia Pages (más lío); lo gratis y estable es la URL de GitHub Pages o un dominio en Cloudflare.
