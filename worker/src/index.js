/**
 * Lapsoe Machinery — Cloudflare Worker
 * - GET /api/highlights  → JSON en GitHub (portada, PC apagado OK)
 * - BDNS / PLACSP        → proxy en vivo (evita CORS del navegador)
 */

const BDNS = "https://www.infosubvenciones.es/bdnstrans/api";
const PLACSP_AGG =
  "https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom";
const PLACSP_EMP =
  "https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1383/EMP_SectorPublico.atom";

const COVERAGE = [
  { code: "ES-CT", name: "Cataluña", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "high" },
  { code: "ES-AN", name: "Andalucía", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "high" },
  { code: "ES-MD", name: "Comunidad de Madrid", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "medium" },
  { code: "ES-VC", name: "Comunidad Valenciana", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "high" },
  { code: "ES-PV", name: "País Vasco", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "high" },
  { code: "ES-GA", name: "Galicia", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "medium" },
  { code: "ES-NC", name: "Navarra", placsp_direct: false, placsp_aggregated: true, own_platform: true, bdns_covered: true, level: "high" },
  { code: "ES-CL", name: "Castilla y León", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "high" },
  { code: "ES-AR", name: "Aragón", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "high" },
  { code: "ES-CM", name: "Castilla-La Mancha", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-CN", name: "Canarias", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-IB", name: "Illes Balears", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-MC", name: "Murcia", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-EX", name: "Extremadura", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-AS", name: "Asturias", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-CB", name: "Cantabria", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-RI", name: "La Rioja", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "medium" },
  { code: "ES-CE", name: "Ceuta", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "low" },
  { code: "ES-ML", name: "Melilla", placsp_direct: true, placsp_aggregated: false, own_platform: false, bdns_covered: true, level: "low" },
];

const SOURCES = [
  { id: "placsp_aggregated", name: "PLACSP — Plataformas agregadas", status: "verified", base_url: PLACSP_AGG },
  { id: "placsp_emp", name: "PLACSP — Encargos medios propios", status: "verified", base_url: PLACSP_EMP },
  { id: "bdns_concesiones", name: "BDNS — Concesiones", status: "verified", base_url: BDNS + "/concesiones/busqueda" },
  { id: "bdns_convocatorias", name: "BDNS — Convocatorias", status: "verified", base_url: BDNS + "/convocatorias/busqueda" },
  { id: "airef_prtr", name: "AIReF — PRTR", status: "deferred", base_url: "https://www.airef.es/" },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));

    try {
      if (url.pathname === "/" || url.pathname === "/api/health") {
        return json({
          status: "ok",
          service: "lapsoe-machinery-worker",
          site: env.SITE_NAME || "Lapsoe Machinery",
          mode: "pages+worker+github-cache",
        });
      }

      if (url.pathname === "/api/highlights") {
        return cors(await serveHighlights(env));
      }

      if (url.pathname === "/api/meta/coverage") return json(COVERAGE);
      if (url.pathname === "/api/meta/sources") return json(SOURCES);
      if (url.pathname === "/api/meta/sync-runs") return json([]);
      if (url.pathname === "/api/meta/autonomic-connectors") {
        return json({
          note: "Conectores autonómicos planificados; sin ingesta en Worker.",
          priority: COVERAGE.filter((c) => c.own_platform).map((c) => ({
            code: c.code,
            name: c.name,
            platform: "propia",
            status: "planned",
          })),
        });
      }

      if (url.pathname === "/api/stats/overview") return cors(await overview(env));
      if (url.pathname === "/api/analysis/investigations") return cors(await investigationsFromCache(env));

      if (url.pathname === "/api/bdns/convocatorias") return cors(await proxyBdns(url, "convocatorias/busqueda"));
      if (url.pathname === "/api/bdns/concesiones") return cors(await proxyConcesiones(url));
      if (url.pathname === "/api/bdns/terceros") return cors(await proxyTerceros(url));

      if (url.pathname === "/api/placsp/contracts/live") return cors(await placspLive(PLACSP_AGG, url));
      if (url.pathname === "/api/placsp/encargos/live") return cors(await placspLive(PLACSP_EMP, url));

      if (url.pathname === "/api/search") return cors(await globalSearch(url));
      if (url.pathname === "/api/contracts") return json({ content: [], total_elements: 0, data_kind: "unavailable_on_worker", note: "Sin SQLite en Worker; usa feed en vivo." });
      if (url.pathname.startsWith("/api/contracts/")) {
        return json({ error: "Ficha local no disponible en Worker", data_kind: "unavailable_on_worker" }, 404);
      }
      if (url.pathname === "/api/grants/awards/local") return json({ content: [], total_elements: 0, data_kind: "unavailable_on_worker" });
      if (url.pathname === "/api/encargos/local") return json({ content: [], data_kind: "unavailable_on_worker" });
      if (url.pathname.startsWith("/api/companies/")) {
        const nif = decodeURIComponent(url.pathname.split("/").pop() || "");
        return cors(await companyProfile(nif));
      }

      return json({ error: "not_found", path: url.pathname }, 404);
    } catch (err) {
      return json({ error: String(err && err.message ? err.message : err) }, 500);
    }
  },
};

function cors(res) {
  const headers = new Headers(res.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  headers.set("Cache-Control", res.headers.get("Cache-Control") || "public, max-age=60");
  return new Response(res.body, { status: res.status, headers });
}

function json(data, status = 200, extraHeaders = {}) {
  return cors(
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
    }),
  );
}

async function serveHighlights(env) {
  const url = env.HIGHLIGHTS_URL;
  if (!url || url.includes("OWNER/")) {
    return json({
      missing: true,
      hint: "Configura HIGHLIGHTS_URL en wrangler.toml al raw de GitHub cuando el repo sea público.",
      shocks: [],
      architecture: {
        homepage: "cached_highlights",
        search_and_browse: "live_via_worker",
        hosting_note: "Worker + Pages: la web sigue viva con el PC apagado.",
      },
    });
  }
  const r = await fetch(url, { cf: { cacheTtl: 300, cacheEverything: true } });
  if (!r.ok) {
    return json({ missing: true, hint: `No se pudo leer highlights (${r.status})`, shocks: [] }, 502);
  }
  const data = await r.json();
  data.missing = false;
  data.served_by = "cloudflare-worker";
  return json(data, 200, { "Cache-Control": "public, max-age=300" });
}

async function overview(env) {
  const [conv, conc, hl] = await Promise.all([
    fetch(`${BDNS}/convocatorias/busqueda?page=0&pageSize=1`).then((r) => r.json()).catch(() => null),
    fetch(`${BDNS}/concesiones/busqueda?page=0&pageSize=1`).then((r) => r.json()).catch(() => null),
    serveHighlights(env).then((r) => r.json()).catch(() => null),
  ]);
  return json({
    local: { note: "Sin DB local en Worker", data_kind: "unavailable_on_worker" },
    live: {
      bdns: {
        convocatorias_total: conv?.totalElements,
        concesiones_total: conc?.totalElements,
        provenance: "BDNS API totalElements",
      },
      placsp: null,
    },
    sources: SOURCES,
    errors: [],
    highlights_generated_at: hl?.generated_at || null,
    disclaimer: "Metadatos oficiales en vivo vía Worker. Portada desde caché GitHub.",
  });
}

async function investigationsFromCache(env) {
  const hlRes = await serveHighlights(env);
  const hl = await hlRes.json();
  const summary = hl.local_analysis_summary || {};
  return json({
    disclaimer:
      "En Worker no hay SQLite. Se sirven alertas/resúmenes de la caché de highlights cuando existan.",
    sample_sizes: summary.sample_sizes || { contracts: 0, grant_awards: 0, in_house_orders: 0 },
    top_contracting_bodies: summary.top_contracting_bodies || [],
    top_grant_beneficiaries: summary.top_grant_beneficiaries || [],
    top_in_house_recipients: [],
    territorial_grants: [],
    alerts: summary.alerts || [],
    data_kind: "cached_or_empty",
    top_grants_live_window: (hl.top_grants || []).slice(0, 10),
    top_contracts_feed: (hl.top_contracts || []).slice(0, 10),
  });
}

function toBdnsDate(iso) {
  if (!iso) return null;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

async function proxyBdns(url, path) {
  const dest = new URL(`${BDNS}/${path}`);
  url.searchParams.forEach((v, k) => {
    if (k === "fecha_desde") dest.searchParams.set("fechaDesde", toBdnsDate(v));
    else if (k === "fecha_hasta") dest.searchParams.set("fechaHasta", toBdnsDate(v));
    else if (k === "page_size") dest.searchParams.set("pageSize", v);
    else if (k === "numero_convocatoria") dest.searchParams.set("numeroConvocatoria", v);
    else if (k === "descripcion") dest.searchParams.set("descripcion", v);
    else if (k === "mrr") dest.searchParams.set("mrr", v);
    else if (k === "page" || k === "order" || k === "direccion") dest.searchParams.set(k, v);
  });
  if (!dest.searchParams.has("page")) dest.searchParams.set("page", "0");
  if (!dest.searchParams.has("pageSize")) dest.searchParams.set("pageSize", "20");
  const r = await fetch(dest.toString());
  const data = await r.json();
  return json({
    provenance: `BDNS API /${path}`,
    data_kind: "official",
    page: data.number,
    page_size: data.size,
    total_elements: data.totalElements,
    total_pages: data.totalPages,
    content: data.content || [],
    advertencia: data.advertencia,
  });
}

async function proxyTerceros(url) {
  const q = url.searchParams.get("q") || url.searchParams.get("busqueda");
  if (!q) return json({ error: "q required" }, 400);
  const r = await fetch(`${BDNS}/terceros?busqueda=${encodeURIComponent(q)}`);
  const data = await r.json();
  return json({ provenance: "BDNS /terceros", data_kind: "official", ...data });
}

async function proxyConcesiones(url) {
  let beneficiarioId = url.searchParams.get("beneficiario_id");
  const beneficiarioQ = url.searchParams.get("beneficiario_q");
  let terceros_resolution = null;
  if (beneficiarioQ && !beneficiarioId) {
    const t = await fetch(`${BDNS}/terceros?busqueda=${encodeURIComponent(beneficiarioQ)}`);
    const tj = await t.json();
    terceros_resolution = tj.terceros || [];
    if (!terceros_resolution.length) {
      return json({
        provenance: "BDNS",
        data_kind: "official",
        page: 0,
        page_size: 20,
        total_elements: 0,
        content: [],
        terceros_resolution: [],
      });
    }
    beneficiarioId = String(terceros_resolution[0].id);
  }

  const dest = new URL(`${BDNS}/concesiones/busqueda`);
  dest.searchParams.set("page", url.searchParams.get("page") || "0");
  dest.searchParams.set("pageSize", url.searchParams.get("page_size") || "20");
  const fd = url.searchParams.get("fecha_desde");
  const fh = url.searchParams.get("fecha_hasta");
  if (fd && fh) {
    dest.searchParams.set("fechaDesde", toBdnsDate(fd));
    dest.searchParams.set("fechaHasta", toBdnsDate(fh));
  }
  if (url.searchParams.get("descripcion")) dest.searchParams.set("descripcion", url.searchParams.get("descripcion"));
  if (url.searchParams.get("numero_convocatoria")) {
    dest.searchParams.set("numeroConvocatoria", url.searchParams.get("numero_convocatoria"));
  }
  if (beneficiarioId) dest.searchParams.set("beneficiario", beneficiarioId);
  dest.searchParams.set("order", url.searchParams.get("order") || "fechaConcesion");
  dest.searchParams.set("direccion", url.searchParams.get("direccion") || "desc");

  const r = await fetch(dest.toString());
  const data = await r.json();
  const content = (data.content || []).map((item) => ({
    ...item,
    beneficiario_parsed: parseBeneficiario(item.beneficiario),
  }));
  return json({
    provenance: "BDNS API /concesiones/busqueda",
    data_kind: "official",
    page: data.number,
    page_size: data.size,
    total_elements: data.totalElements,
    total_pages: data.totalPages,
    content,
    terceros_resolution,
    beneficiario_id_used: beneficiarioId ? Number(beneficiarioId) : null,
    advertencia: data.advertencia,
  });
}

function parseBeneficiario(raw) {
  if (!raw) return { name: null, nif: null, nif_is_public: false, is_anonymized_person: false };
  const pub = /^([A-Za-z]\d{7}\d|[A-Za-z]\d{8}|\d{8}[A-Za-z])\s+(.+)$/.exec(raw.trim());
  if (pub) return { name: pub[2].trim(), nif: pub[1].toUpperCase(), nif_is_public: true, is_anonymized_person: false };
  const anon = /^\*{3}.+\*{2}\s+(.+)$/.exec(raw.trim());
  if (anon) return { name: anon[1].trim(), nif: null, nif_is_public: false, is_anonymized_person: true };
  return { name: raw.trim(), nif: null, nif_is_public: false, is_anonymized_person: false };
}

function parseAmountFromSummary(summary) {
  if (!summary) return null;
  const m = /Importe:\s*([0-9][0-9.,]*)\s*EUR/i.exec(summary);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

async function placspLive(feedUrl, reqUrl) {
  const limit = Math.min(Number(reqUrl.searchParams.get("limit") || "25"), 100);
  const r = await fetch(feedUrl);
  if (!r.ok) return json({ error: `PLACSP ${r.status}` }, 502);
  const xml = await r.text();
  const entries = [];
  const entryRe = /<entry[\s\S]*?<\/entry>/g;
  let match;
  let feedUpdated = null;
  const fu = /<updated>([^<]+)<\/updated>/.exec(xml);
  if (fu) feedUpdated = fu[1];
  while ((match = entryRe.exec(xml)) && entries.length < limit) {
    const block = match[0];
    const grab = (re) => {
      const m = re.exec(block);
      return m ? m[1].trim() : null;
    };
    const title = grab(/<title[^>]*>([\s\S]*?)<\/title>/);
    const summary = grab(/<summary[^>]*>([\s\S]*?)<\/summary>/);
    const id = grab(/<id>([\s\S]*?)<\/id>/);
    const folder = grab(/<cbc:ContractFolderID>([\s\S]*?)<\/cbc:ContractFolderID>/);
    const body = grab(/<cac:PartyName>\s*<cbc:Name>([\s\S]*?)<\/cbc:Name>/);
    const bodyId = grab(/<cbc:ID[^>]*>([\s\S]*?)<\/cbc:ID>/);
    const status = grab(/<cbc-place-ext:ContractFolderStatusCode>([\s\S]*?)<\/cbc-place-ext:ContractFolderStatusCode>/);
    const link = grab(/<link[^>]*href="([^"]+)"/);
    let amount = null;
    const amt = grab(/<cbc:TotalAmount[^>]*>([\s\S]*?)<\/cbc:TotalAmount>/) ||
      grab(/<cbc:TaxExclusiveAmount[^>]*>([\s\S]*?)<\/cbc:TaxExclusiveAmount>/);
    if (amt) amount = parseFloat(amt.replace(",", "."));
    if (amount == null) amount = parseAmountFromSummary(summary);
    entries.push({
      source_entry_id: id,
      contract_folder_id: folder,
      title: title ? title.replace(/<!\[CDATA\[|\]\]>/g, "") : null,
      summary: summary ? summary.replace(/<!\[CDATA\[|\]\]>/g, "") : null,
      contracting_body_name: body,
      contracting_body_id: bodyId,
      amount,
      status_code: status,
      source_url: link,
    });
  }
  return json({
    ok: true,
    feed_url: feedUrl,
    meta: { feed_updated: feedUpdated, entries_returned: entries.length },
    entries,
    provenance: "PLACSP Atom vía Cloudflare Worker",
    data_kind: "official_sample",
  });
}

async function globalSearch(url) {
  const q = url.searchParams.get("q");
  if (!q || q.length < 2) return json({ error: "q min 2" }, 400);
  const errors = [];
  let terceros = [];
  let conv = [];
  try {
    const t = await fetch(`${BDNS}/terceros?busqueda=${encodeURIComponent(q)}`);
    const tj = await t.json();
    terceros = tj.terceros || [];
  } catch (e) {
    errors.push(String(e));
  }
  try {
    const c = await fetch(
      `${BDNS}/convocatorias/busqueda?page=0&pageSize=5&descripcion=${encodeURIComponent(q)}`,
    );
    const cj = await c.json();
    conv = cj.content || [];
  } catch (e) {
    errors.push(String(e));
  }
  return json({
    query: q,
    data_kind: "mixed_official",
    results: {
      companies_or_beneficiaries: terceros,
      grant_calls_live: conv,
      contracts_local: [],
      grants_local: [],
    },
    errors,
  });
}

async function companyProfile(nif) {
  const clean = (nif || "").toUpperCase();
  let terceros = [];
  let concesiones = [];
  let total = null;
  try {
    const t = await fetch(`${BDNS}/terceros?busqueda=${encodeURIComponent(clean)}`);
    const tj = await t.json();
    terceros = tj.terceros || [];
    if (terceros[0]?.id) {
      const c = await fetch(
        `${BDNS}/concesiones/busqueda?page=0&pageSize=50&beneficiario=${terceros[0].id}`,
      );
      const cj = await c.json();
      concesiones = cj.content || [];
      total = cj.totalElements;
    }
  } catch (e) {
    return json({ nif: clean, errors: [String(e)], live_bdns: null, local: { grant_awards_local: [], in_house_orders_local: [], annual_grant_amounts: [] } });
  }
  return json({
    nif: clean,
    match_method: "exact_nif",
    disclaimer: "Solo NIF/CIF público exacto. Worker sin fusión por nombre.",
    live_bdns: {
      terceros,
      concesiones_total: total,
      concesiones,
      provenance: "BDNS vía Worker",
    },
    local: { grant_awards_local: [], in_house_orders_local: [], annual_grant_amounts: [] },
    errors: [],
  });
}
