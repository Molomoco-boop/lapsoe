# OBSERVATORIO — Plan de ejecución e infraestructura

Documento previo a cualquier ingesta pesada. Basado en `walkthrough.md` y en pruebas adicionales del 31/10/2026.

---

## 1. Estado de partida

| Elemento | Estado |
|:---|:---|
| Código de aplicación | Vacío (solo informe de auditoría) |
| Fuentes verificadas sin certificado | PLACSP `sindicacion_1044`, PLACSP EMP `sindicacion_1383`, BDNS API |
| Fuentes bloqueadas / diferidas | PLACSP `643`/`1143` (certificado), AIReF ficheros grandes (solo servidor) |
| Datos locales | Ninguno — no se inventarán cifras |

---

## 2. Hallazgos de verificación (pre-sincronizador)

### BDNS

| Aspecto | Resultado verificado |
|:---|:---|
| Indexación de páginas | **0-indexed** (`page=0` es la primera) |
| `pageSize` | Funciona al menos hasta **1000** |
| Fechas de concesión | `fechaDesde` + `fechaHasta` en formato **`DD/MM/YYYY`** (ISO `YYYY-MM-DD` → HTTP 400) |
| Fechas de alta/registro | `fechaRegInicio` + `fechaRegFin` en **`DD/MM/YYYY`** |
| Beneficiario | Requiere **id interno** de `/api/terceros?busqueda=...`, no el CIF directo |
| Convocatoria | `numeroConvocatoria` filtra correctamente |
| Texto | `descripcion` filtra |
| `mrr` | Filtra en **convocatorias**; en **concesiones** no altera el total (no usar como filtro fiable ahí) |
| Parámetros ignorados | Muchos nombres “lógicos” (`nivel1`, `importeMin`, etc.) **no filtran** aunque respondan 200 |

### PLACSP

| Aspecto | Resultado |
|:---|:---|
| Feed agregación CCAA | ✅ ~4 MB Atom/CODICE, paginación `rel="next"` |
| Feed encargos | ✅ Verificado en auditoría |
| Feeds directos 643/1143 | ❌ Certificado — fuera de alcance ETAPA 1 |

### AIReF

No integrar descarga en el portátil. Stub de conector + página “pendiente de procesamiento en servidor”.

---

## 3. Arquitectura ETAPA 1 (ligera en el PC)

```
Navegador  →  Next.js (UI)  →  FastAPI (API + conectores)
                                    ↓
                              SQLite local (dev)
                              PostgreSQL (prod, cuando exista servidor)
                                    ↓
                         data/raw/ (Atom/JSON crudos, gitignored)
                         data/parquet/ (opcional, análisis)
```

**No se instala en ETAPA 1:** Docker, Elasticsearch, Redis, MinIO.

| Componente | Dec | Producción (recomendado) |
|:---|:---|:---|
| Frontend | Next.js 15 + TypeScript | Mismo, Vercel o VPS |
| Backend | FastAPI + httpx + lxml | Mismo en VPS |
| DB | SQLite vía SQLAlchemy | PostgreSQL 16 |
| Analítica | DuckDB bajo demanda | DuckDB + Parquet en disco/SSD |
| Disco local | < 2 GB staging de pruebas | 200–500 GB SSD |
| RAM | 8–16 GB suficiente para prototipo | 16–32 GB ingesta |

**VPS mínimo para ingesta real (no ahora):** 4 vCPU, 16 GB RAM, 200 GB SSD (~20 €/mes).

---

## 4. Política de datos (obligatoria)

1. Ninguna cifra inventada ni “demo” presentada como oficial.
2. Portada: totales solo si existen en DB local **o** metadatos oficiales de API (`totalElements`) etiquetados como “dato de la fuente en vivo”.
3. Ingesta de desarrollo: **smoke** (1 página Atom / ≤100 registros BDNS / ventana de fechas corta).
4. Históricos anuales PLACSP y 31M concesiones: **solo en servidor**, incremental.
5. Personas físicas con NIF anonimizado (`***XXXX**`): no intentar reconstrucción.
6. Cada dato muestra: fuente, periodo, fecha de extracción, tipo (oficial / calculado / no disponible).

---

## 5. Fases de producto

| Etapa | Alcance | Ingesta |
|:---|:---|:---|
| **1 (ahora)** | Diseño, navegación, modelo, API, conectores smoke PLACSP+BDNS, portada, metodología, listados proxy | Solo muestras |
| **2** | Fichas contrato/subvención/empresa/organismo | Incremental diario acotado |
| **3** | Encargos, stub AIReF, mapa | EMP Atom + Parquet en servidor |
| **4** | Anomalías e investigaciones | Consultas SQL/DuckDB sobre DB propia |
| **5** | CCAA propias, optimización, publicación | Conectores sin duplicar PLACSP |

---

## 6. Modelo de datos inicial (resumen)

- `sources` / `sync_runs` — catálogo y registro de ejecuciones
- `organizations` — órganos (DIR3 / ID_OC_PLAT / codigoInvente)
- `companies` — NIF/CIF público + nombre canónico
- `contracts` / `contract_documents` — licitaciones PLACSP
- `in_house_orders` — encargos a medios propios
- `grant_calls` / `grant_awards` — convocatorias y concesiones BDNS
- `coverage_territories` — qué está realmente cubierto

Claves de deduplicación previstas: Atom `entry/id`, `ContractFolderID`+fuente, `codConcesion`, `id` BDNS.

---

## 7. Riesgos y límites a comunicar en la UI

- Agregación PLACSP **sin contratos menores** de las 7 CCAA con plataforma propia.
- Feeds AGE/menores directos no disponibles sin certificado.
- BDNS retira publicidad (2/4 años); totales de API ≠ archivo histórico permanente.
- No hay fuente pública fiable de **pagos ejecutados** vs concesiones/adjudicaciones.
- AIReF: NIF anonimizado; actualización trimestral.

---

## 8. Criterio para pasar a ingesta pesada

Solo cuando exista:

1. Servidor con disco suficiente y cron.
2. Sincronizador con checkpoint (`rel="next"`, `fechaReg*` BDNS).
3. Deduplicación y `sync_runs` operativos.
4. Rate limiting conservador hacia BDNS (evitar “manifiesto abuso”).

Hasta entonces: ETAPA 1 con consultas paginadas en vivo + smoke ingest opcional y reversible.
