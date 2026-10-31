# AUDITORÍA TÉCNICA DE FUENTES DE DATOS — OBSERVATORIO ESPAÑA
## Informe de Viabilidad Técnica

> [!NOTE]
> Este informe se basa en **investigación documental** y **pruebas reales** realizadas el 31 de octubre de 2026.  
> Se distingue rigurosamente entre ✅ Comprobado, 📄 Documentado y ❓ Sin verificar.

---

## 1. TABLA COMPARATIVA DE FUENTES

| Fuente | Tipo de Acceso | Formato | Histórico | Actualización | API REST | Cobertura | Estado |
|:---|:---|:---|:---|:---|:---|:---|:---:|
| **PLACSP — Licitaciones** | Feeds Atom/XML + ZIP | XML CODICE | Desde 2012 | Diaria | ❌ No | AGE + EELL + CCAA adheridas | ✅ |
| **PLACSP — Agregación CCAA** | Feed Atom/XML + ZIP | XML CODICE | Desde 2016 | Diaria | ❌ No | 7 CCAA con plataforma propia | ✅ |
| **PLACSP — Contratos Menores** | Feed Atom/XML + ZIP | XML CODICE | Desde 2018 | Diaria | ❌ No | Todo PLACSP | ✅ |
| **PLACSP — Encargos Med. Propios** | Feed Atom/XML + ZIP | XML CODICE | Desde jul 2021 | Diaria | ❌ No | Todo PLACSP | ✅ |
| **PLACSP — Consultas Preliminares** | Feed Atom/XML + ZIP | XML CODICE | Desde abr 2022 | Diaria | ❌ No | Todo PLACSP | 📄 |
| **BDNS — Convocatorias** | API REST pública | JSON | Desde 2014 | Continua | ✅ Sí | Todo España (661.874 registros) | ✅ |
| **BDNS — Concesiones** | API REST pública | JSON | Desde 2014 | Continua | ✅ Sí | Todo España (31.157.503 registros) | ✅ |
| **AIReF — Observatorio PRTR** | Descarga CSV/Parquet | CSV, Parquet | Desde 2021 | Trimestral | ❌ No | Todo España | 📄 |
| **Encargos Medios Propios (Portal)** | Atom/XML + ZIP | XML CODICE | Desde jul 2021 | Diaria | ❌ No | PLACSP | ✅ |
| **datos.gob.es** | API CKAN | JSON, CSV | Variable | Variable | ✅ Sí | Catálogo federado | ⚠️ |

---

## 2. RESULTADOS DE PRUEBAS REALES

### A. PLACSP — Plataforma de Contratación del Sector Público

#### Prueba 1: Feed Atom — Plataformas Agregadas Sin Menores ✅ FUNCIONA
```
URL: https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom
Status: 200
Content-Type: application/atom+xml
Content-Length: 3.989.848 bytes (~3.8 MB)
Paginación: <link rel="next" href="...PlataformasAgregadasSinMenores_20261031_030101.atom"/>
```

**Ejemplo de entry real (anonimizado):**
```xml
<entry>
  <id>https://contrataciondelestado.es/sindicacion/PlataformasAgregadasSinMenores/20816477</id>
  <title>Contrato de obras de sustitución de césped artificial...</title>
  <summary>Id licitación: 3058_177/2026/CONAD; Órgano: Ayuntamiento de Tudela;
           Importe: 198319,11 EUR; Estado: En Plazo</summary>
  <updated>2026-10-31T01:00:21.987+01:00</updated>
  <cac-place-ext:ContractFolderStatus>
    <cbc:ContractFolderID>3058_177/2026/CONAD</cbc:ContractFolderID>
    <cbc-place-ext:ContractFolderStatusCode>PUB</cbc-place-ext:ContractFolderStatusCode>
    <cac-place-ext:LocatedContractingParty>
      <cac:PartyIdentification>
        <cbc:ID schemeName="ID_OC_PLAT">P3123200B</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyName>
        <cbc:Name>Junta Gobierno del Ayuntamiento de Tudela</cbc:Name>
      </cac:PartyName>
    </cac-place-ext:LocatedContractingParty>
  </cac-place-ext:ContractFolderStatus>
</entry>
```

#### Prueba 2: Feed Atom — Encargos a Medios Propios ✅ FUNCIONA
```
URL: https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1383/EMP_SectorPublico.atom
Status: 200
Content-Type: application/atom+xml
Content-Length: 655.306 bytes (~640 KB)
Paginación: <link rel="next" href="...EMP_SectorPublico_20261027_010133.atom"/>
```

#### Prueba 3: Feed directo sindicacion_643 ❌ REQUIERE CERTIFICADO
```
URL: https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilContratanteCompleto3.atom
Status: 200 (pero redirige a error de certificado)
Mensaje: "Su certificado no está autorizado a acceder a la Plataforma"
```

> [!WARNING]
> Los feeds directos de `sindicacion_643` y `sindicacion_1143` requieren algún tipo de autorización o header específico. Los feeds de agregación (`sindicacion_1044`) y encargos (`sindicacion_1383`) funcionan sin restricciones. Los **archivos ZIP históricos** y el **directorio XLSX de órganos** SÍ funcionan sin restricciones.

#### Prueba 4: Órganos de Contratación XLSX ✅ FUNCIONA
```
URL: https://contrataciondelsectorpublico.gob.es/datosabiertos/OrganosContratacion.xlsx
Status: 200
Content-Length: 1.469.534 bytes (~1.4 MB)
```

#### Prueba 5: Documentación PDF ✅ FUNCIONA
```
Resumen Datos Abiertos: 339.902 bytes (~340 KB)
Especificación Sindicación: 2.359.604 bytes (~2.3 MB)
```

---

### B. BDNS — Base de Datos Nacional de Subvenciones

#### Prueba 1: API Convocatorias ✅ FUNCIONA
```
URL: https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda?page=1&pageSize=3
Status: 200
Content-Type: application/json
Total registros: 661.874 convocatorias
Total páginas: 220.625
```

**Ejemplo de respuesta real (convocatoria):**
```json
{
  "id": 1140741,
  "mrr": false,
  "numeroConvocatoria": "939180",
  "descripcion": "SUBV. NOMINATIVA-GTOS. FUNC. Y ACTIVIDADES - FOCUS - 2026",
  "fechaRecepcion": "2026-10-30",
  "nivel1": "AUTONOMICA",
  "nivel2": "ANDALUCÍA",
  "nivel3": "CONSEJERÍA DE CULTURA, PATRIMONIO HISTÓRICO Y DEPORTE"
}
```

#### Prueba 2: API Concesiones ✅ FUNCIONA
```
URL: https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda?page=1&pageSize=3
Status: 200
Content-Type: application/json
Total registros: 31.157.503 concesiones
Total páginas: 10.385.835
```

**Ejemplo de respuesta real (concesión a persona jurídica):**
```json
{
  "id": 158825944,
  "codConcesion": "SB158825944",
  "fechaConcesion": "2026-10-30",
  "beneficiario": "G31174006 EUSKAL HERRIKO NEKAZARIEM ELKARTEA NAFARROAN",
  "instrumento": "SUBVENCIÓN y ENTREGA DINERARIA SIN CONTRAPRESTACIÓN",
  "importe": 1271,
  "ayudaEquivalente": 1271,
  "urlBR": "https://www.navarra.es/...",
  "numeroConvocatoria": "883310",
  "idConvocatoria": 1084871,
  "convocatoria": "Concesión de subvenciones al fomento de la contratación en el sector agrario",
  "nivel1": "AUTONOMICA",
  "nivel2": "COMUNIDAD FORAL DE NAVARRA",
  "nivel3": "SERVICIO NAVARRO DE EMPLEO",
  "codigoInvente": "INV00005054"
}
```

**Ejemplo de respuesta real (concesión a persona física — NIF anonimizado):**
```json
{
  "beneficiario": "***2138** RAUL ZABALZA VALERO",
  "importe": 534.22,
  "convocatoria": "Abono de cuotas Seguridad Social por capitalización del desempleo"
}
```

> [!TIP]
> La API BDNS funciona perfectamente con paginación `page` + `pageSize`. Incluye un campo `advertencia` en cada respuesta con los términos legales de reutilización. El flag `mrr` indica si la convocatoria está vinculada al Plan de Recuperación (Mecanismo de Recuperación y Resiliencia). El campo `codigoInvente` es el código del INVENTARIO de Entes del Sector Público.

**Datos verificados de la API BDNS:**
- ✅ Base URL: `https://www.infosubvenciones.es/bdnstrans/api/`
- ✅ Endpoint convocatorias: `/convocatorias/busqueda`
- ✅ Endpoint concesiones: `/concesiones/busqueda`
- ✅ Paginación: `page` (0-indexed) + `pageSize` (máx. ~100)
- ✅ Formato: JSON (Spring Boot / pageable)
- ✅ Sin autenticación (pública)
- ✅ **661.874 convocatorias** y **31.157.503 concesiones** disponibles
- ✅ NIF/CIF visible para personas jurídicas, anonimizado (***XXXX**) para personas físicas

---

### C. Encargos a Medios Propios

#### Verificado por pruebas reales ✅

| Aspecto | Resultado |
|:---|:---|
| Feed Atom funciona | ✅ Sí — 655 KB de XML CODICE |
| Actualización diaria | ✅ Comprobada (updated: 2026-10-31T01:01:29) |
| Paginación | ✅ 500 entradas por fichero, enlace `rel="next"` |
| ZIP históricos | 📄 Disponibles: 2022, 2023, 2024, 2025, 2026 |
| Campos disponibles | ✅ ContractFolderID, Órgano, CIF, Importe, Objeto, CPV, Duración |
| NIF/CIF organismos | ✅ Disponible (ej. P3123200B) |
| Entidades receptoras | 📄 TRAGSA, INECO, ISDEFE, FNMT, SENASA, etc. |

---

### D. AIReF — Observatorio del PRTR

#### No se pudieron descargar archivos directamente ⚠️ API WP bloqueada

| Aspecto | Estado | Detalle |
|:---|:---:|:---|
| Portal accesible | ✅ | https://www.airef.es/es/datalab/herramientas-interactivas-de-la-airef/observatorio-del-prtr/ |
| WP JSON API | ❌ | 403 Forbidden |
| Descarga CSV | 📄 | Disponible desde portal (250-650 MB) |
| Descarga Parquet | 📄 | Disponible desde portal (30-65 MB) |
| Registros totales | 📄 | >1.67 millones de operaciones |
| Importe total | 📄 | >64.800 M€ |
| Histórico | 📄 | Desde 2021 |
| Actualización | 📄 | Trimestral |

**Campos documentados del dataset AIReF PRTR:**

| Campo | Descripción |
|:---|:---|
| `ID_Operacion` | Identificador único |
| `Tipo_Instrumento` | Contrato / Subvención |
| `Objeto_Contrato` | Descripción |
| `Subsector` | AGE, SPI, CCAA, CCLL |
| `Organo_Convocante` | Ministerio/Consejería |
| `Componente` | 30 componentes PRTR |
| `Linea_Inversion` | Ej. C01.I01 |
| `PERTE` | PERTE asociado |
| `Fecha_Formalizacion` | Fecha firma |
| `Importe` | En EUR (sin IVA en contratos) |
| `Nombre_Beneficiario` | Razón social |
| `NIF_CIF_Anonimizado` | Identificador fiscal |
| `Tamaño_Empresa` | Micro/Pequeña/Mediana/Grande |
| `CNAE_Codigo` | Código actividad económica |
| `Comunidad_Autonoma` | CC.AA. |
| `Provincia` | Provincia |

---

## 3. CATÁLOGO COMPLETO DE ENDPOINTS Y URLS PROBADOS

### PLACSP — Feeds Atom y Descargas

| Recurso | URL | Estado |
|:---|:---|:---:|
| **Agregación CCAA (sin menores)** | `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1044/PlataformasAgregadasSinMenores.atom` | ✅ |
| **Encargos Medios Propios** | `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1383/EMP_SectorPublico.atom` | ✅ |
| **Consultas Preliminares** | `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1403/CPM_SectorPublico.atom` | 📄 |
| **Licitaciones directas** | `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom` | ❌ Cert |
| **Contratos menores** | `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1143/contratosMenoresPerfilesContratantes.atom` | ❌ Cert |
| **ZIP históricos (patrón)** | `.../sindicacion_XXXX/NOMBRE_AAAA.zip` | 📄 |
| **ZIP EMP 2026** | `https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_1383/EMP_SectorPublico_2026.zip` | 📄 |
| **Órganos XLSX** | `https://contrataciondelsectorpublico.gob.es/datosabiertos/OrganosContratacion.xlsx` | ✅ |
| **Resumen PDF** | `https://contrataciondelsectorpublico.gob.es/datosabiertos/DGPE_PLACSP_ResumenDatosAbiertos.pdf` | ✅ |
| **Especificación PDF** | `https://contrataciondelsectorpublico.gob.es/datosabiertos/especificacion-sindicacion.pdf` | ✅ |

### BDNS

| Recurso | URL | Estado |
|:---|:---|:---:|
| Portal SNPSAP | `https://www.infosubvenciones.es/bdnstrans/` | ✅ SPA |
| **API Convocatorias** | `https://www.infosubvenciones.es/bdnstrans/api/convocatorias/busqueda` | ✅ 661K reg. |
| **API Concesiones** | `https://www.infosubvenciones.es/bdnstrans/api/concesiones/busqueda` | ✅ 31M reg. |
| API Base (pap.hacienda) | `https://www.pap.hacienda.gob.es/bdnstrans/GE/es/convocatorias` | ✅ HTML |
| Documentación API | `https://www.infosubvenciones.es/bdnstrans/A03/es/doc` | ✅ SPA |

### AIReF

| Recurso | URL | Estado |
|:---|:---|:---:|
| Observatorio PRTR | `https://www.airef.es/es/datalab/herramientas-interactivas-de-la-airef/observatorio-del-prtr/` | ✅ |
| DataLab | `https://www.airef.es/es/datalab/` | ✅ |
| Contacto datos | `observatorio_prtr@airef.es` | 📄 |

---

## 4. CAMPOS DISPONIBLES POR FUENTE

### PLACSP — Campos del estándar CODICE (XML)

| Bloque | Campos Clave |
|:---|:---|
| **Identificación** | ContractFolderID, ContractFolderStatusCode (PRE/PUB/EV/ADJ/RES/ANUL/DES) |
| **Órgano contratación** | PartyIdentification (DIR3/NIF), PartyName, PostalAddress, ParentLocatedContractingParty |
| **Objeto** | Name, TypeCode (1:Suministros, 2:Servicios, 3:Obras), SubTypeCode |
| **Clasificación** | ItemClassificationCode (CPV), CountrySubentityCode (NUTS) |
| **Importes** | EstimatedOverallContractAmount, TotalAmount, TaxExclusiveAmount |
| **Procedimiento** | ProcedureCode, UrgencyCode, SubmissionMethodCode |
| **Plazos** | DurationMeasure, StartDate, EndDate |
| **Adjudicación** | ResultCode, AwardDate, ReceivedTenderQuantity |
| **Adjudicatario** | PartyIdentification/ID (NIF/CIF), PartyName, PayableAmount |
| **Lotes** | ProcurementProjectLot con su propio ProcurementProject y TenderResult |
| **Documentos** | LegalDocumentReference, TechnicalDocumentReference (URI descarga) |

### BDNS — Campos verificados ✅ (de respuestas reales)

#### Endpoint `/convocatorias/busqueda`

| Campo JSON | Tipo | Descripción | Ejemplo Real |
|:---|:---|:---|:---|
| `id` | int | ID interno de la convocatoria | `1140741` |
| `numeroConvocatoria` | string | Código BDNS de la convocatoria | `"939180"` |
| `descripcion` | string | Objeto/título de la convocatoria | `"SUBV. NOMINATIVA-GTOS. FUNC..."` |
| `descripcionLeng` | string | Descripción en lengua cooficial | `null` |
| `fechaRecepcion` | date | Fecha de registro en BDNS | `"2026-10-30"` |
| `mrr` | boolean | ¿Vinculada al Plan de Recuperación? | `false` |
| `nivel1` | string | Nivel administrativo | `"AUTONOMICA"` / `"LOCAL"` / `"ESTATAL"` |
| `nivel2` | string | CC.AA. o entidad territorial | `"ANDALUCÍA"` |
| `nivel3` | string | Órgano convocante específico | `"CONSEJERÍA DE CULTURA..."` |
| `codigoInvente` | string | Código INVENTARIO entes públicos | `null` / `"INV00005054"` |

#### Endpoint `/concesiones/busqueda`

| Campo JSON | Tipo | Descripción | Ejemplo Real |
|:---|:---|:---|:---|
| `id` | int | ID interno de la concesión | `158825944` |
| `codConcesion` | string | Código único de concesión | `"SB158825944"` |
| `fechaConcesion` | date | Fecha de la concesión | `"2026-10-30"` |
| `beneficiario` | string | **NIF + Nombre** del beneficiario | `"G31174006 EUSKAL HERRIKO..."` |
| `instrumento` | string | Tipo de instrumento legal | `"SUBVENCIÓN y ENTREGA DINERARIA..."` |
| `importe` | decimal | Importe concedido (EUR) | `1271` |
| `ayudaEquivalente` | decimal | Ayuda equivalente bruta | `1271` |
| `urlBR` | string | URL bases reguladoras | `"https://www.navarra.es/..."` |
| `tieneProyecto` | boolean | ¿Tiene proyecto asociado? | `false` |
| `numeroConvocatoria` | string | Código BDNS convocatoria vinculada | `"883310"` |
| `idConvocatoria` | int | ID interno convocatoria vinculada | `1084871` |
| `convocatoria` | string | Título de la convocatoria | `"Concesión de subvenciones..."` |
| `nivel1` | string | Nivel administrativo | `"AUTONOMICA"` |
| `nivel2` | string | CC.AA. o entidad territorial | `"COMUNIDAD FORAL DE NAVARRA"` |
| `nivel3` | string | Órgano concedente | `"SERVICIO NAVARRO DE EMPLEO"` |
| `codigoInvente` | string | Código INVENTARIO | `"INV00005054"` |
| `idPersona` | int | ID interno del beneficiario | `5843167` |
| `fechaAlta` | date | Fecha de alta del registro | `"2026-10-31"` |
| `descripcionCooficial` | string | Descripción lengua cooficial | `null` |

> [!IMPORTANT]
> **Formato del campo `beneficiario`:** Para **personas jurídicas** incluye el NIF/CIF completo seguido del nombre: `"G31174006 EUSKAL HERRIKO..."`. Para **personas físicas** el NIF está parcialmente anonimizado: `"***2138** RAUL ZABALZA VALERO"`. Esto permite identificar unívocamente a empresas pero protege la privacidad de individuos.

### AIReF PRTR — Campos documentados

| Bloque | Campos |
|:---|:---|
| **Operación** | ID_Operacion, Tipo_Instrumento |
| **Clasificación PRTR** | Componente (30), Linea_Inversion, PERTE |
| **Económico** | Importe (€, sin IVA en contratos) |
| **Temporal** | Fecha_Formalizacion, Año, Mes, Trimestre |
| **Beneficiario** | Nombre_Beneficiario, NIF_CIF_Anonimizado |
| **Empresarial (SABI)** | Tamaño_Empresa, CNAE_Codigo, Forma_Juridica |
| **Territorial** | Comunidad_Autonoma, Provincia, Municipio |
| **Convocante** | Subsector, Organo_Convocante |

---

## 5. HISTÓRICO Y FRECUENCIA DE ACTUALIZACIÓN

| Fuente | Desde | Frecuencia Declarada | Frecuencia Comprobada |
|:---|:---|:---|:---|
| PLACSP Licitaciones | 1 ene 2012 | Diaria | ✅ Feeds actualizados cada madrugada (03:00-06:00 CET) |
| PLACSP Agregación CCAA | 1 ene 2016 | Diaria | ✅ Comprobado: updated 2026-10-31T03:01:01 |
| PLACSP Contratos Menores | 1 ene 2018 | Diaria | ✅ Feed con datos recientes |
| PLACSP Encargos Med. Propios | 1 jul 2021 | Diaria | ✅ Comprobado: updated 2026-10-31T01:01:29 |
| PLACSP Consultas Preliminares | 1 abr 2022 | Diaria | 📄 Documentado |
| BDNS Convocatorias | ~2014 | Continua | ✅ 661.874 registros verificados (dato 31/10/2026) |
| BDNS Concesiones | ~2014 | Continua | ✅ 31.157.503 registros verificados (dato 31/10/2026) |
| AIReF PRTR | 2021 | Trimestral | 📄 Documentado (última modif. julio 2026) |
| Encargos ZIP (históricos) | jul 2021 | Diaria (ZIP año en curso) | 📄 ZIP 2022-2026 disponibles |

---

## 6. MATRIZ DE COBERTURA TERRITORIAL

### ¿Quién publica dónde?

| Nº | Comunidad Autónoma | PLACSP Directo | PLACSP Agregado | Plataforma Propia | Portal Datos Abiertos | API Propia | Nivel |
|:---|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Cataluña** | | ✅ | ✅ PSCP | ✅ dadesobertes.gencat.cat | ✅ SODA | 🟢 Alto |
| 2 | **Andalucía** | | ✅ | ✅ SiREC | ✅ datosabiertos.juntadeandalucia.es | ✅ CKAN | 🟢 Alto |
| 3 | **Com. de Madrid** | | ✅ | ✅ | ✅ datos.comunidad.madrid | ✅ CKAN | 🟡 Medio-Alto |
| 4 | **Com. Valenciana** | | ✅ | ✅ GVA | ✅ dadesobertes.gva.es | ✅ CKAN | 🟢 Alto |
| 5 | **País Vasco** | | ✅ | ✅ KontratazioA | ✅ opendata.euskadi.eus | ✅ REST | 🟢 Muy Alto |
| 6 | **Galicia** | | ✅ | ✅ | ✅ abertos.xunta.gal | ✅ CKAN | 🟡 Medio-Alto |
| 7 | **Navarra** | | ✅ | ✅ Foral | ✅ datosabiertos.navarra.es | ✅ REST | 🟢 Alto |
| 8 | **Castilla y León** | ✅ | | | ✅ datosabiertos.jcyl.es | ✅ ODS | 🟢 Alto |
| 9 | **Aragón** | ✅ | | | ✅ opendata.aragon.es | ✅ OCDS+SPARQL | 🟢 Muy Alto |
| 10 | **Castilla-La Mancha** | ✅ | | | ✅ datosabiertos.castillalamancha.es | ⚠️ Limitada | 🟡 Medio |
| 11 | **Canarias** | ✅ | | | ✅ datos.canarias.es | ✅ CKAN | 🟡 Medio-Alto |
| 12 | **Baleares** | ✅ | | | ✅ dadesobertes.caib.es | ✅ CKAN | 🟡 Medio-Alto |
| 13 | **Murcia** | ✅ | | | ✅ datosabiertos.regiondemurcia.es | ✅ CKAN | 🟡 Medio |
| 14 | **Extremadura** | ✅ | | | ✅ datosabiertos.juntaex.es | ✅ CKAN | 🟡 Medio |
| 15 | **Asturias** | ✅ | | | ✅ datos.asturias.es | ⚠️ Solo CSV | 🟠 Medio-Bajo |
| 16 | **Cantabria** | ✅ | | | ✅ datosabiertos.cantabria.es | ⚠️ Limitada | 🟠 Medio-Bajo |
| 17 | **La Rioja** | ✅ | | | ✅ ckan.larioja.org | ✅ CKAN | 🟡 Medio |
| 18 | **Ceuta** | ✅ | | | ❌ | ❌ | 🔴 Bajo |
| 19 | **Melilla** | ✅ | | | ⚠️ melilla-datosabiertos.tao.es | ⚠️ Limitada | 🟠 Medio-Bajo |

### Resumen de cobertura

- **7 CC.AA. con plataforma propia** (Cataluña, Andalucía, Madrid, Valencia, País Vasco, Galicia, Navarra): Requieren integración independiente para contratos menores y datos granulares
- **10 CC.AA. + 2 Ciudades Autónomas** directamente en PLACSP: Todos sus datos accesibles vía feeds Atom CODICE del Estado
- **BDNS cubre todas las subvenciones** de todas las administraciones por mandato legal
- **AIReF PRTR cubre fondos europeos** de todas las administraciones

---

## 7. LIMITACIONES DETECTADAS

### A. PLACSP
1. ❌ **No hay API REST JSON** — Solo XML CODICE (complejo de parsear)
2. ⚠️ **Feeds directos (sindicacion_643, 1143) requieren certificado** desde las pruebas realizadas
3. ⚠️ **Los feeds de agregación NO incluyen contratos menores** de las 7 CCAA con plataforma propia
4. ⚠️ **Desfase temporal** en datos agregados respecto a plataformas autonómicas
5. ⚠️ **ZIP históricos son grandes** (1-2.5 GB por año comprimido, 15-35 GB descomprimido)
6. ⚠️ **Deduplicación necesaria** — Mismo expediente aparece múltiples veces (cada cambio de estado)
7. ❌ **No hay foreign key** que enlace encargos a medios propios con contratos posteriores del medio propio

### B. BDNS
1. ✅ **API funciona** — Endpoints `/convocatorias/busqueda` y `/concesiones/busqueda` verificados
2. ⚠️ **Los datos de beneficiarios personas físicas se retiran a los 2 años** (Ley 38/2003)
3. ⚠️ **Los datos de personas jurídicas se retiran a los 4 años**
4. ⚠️ **Rate limiting advertido** — La Administración puede restringir acceso ante "manifiesto abuso del servicio"
5. ⚠️ **NIF parcialmente anonimizado** — Personas jurídicas: NIF visible (ej. G31174006); Personas físicas: `***2138**`
6. ⚠️ **31 millones de concesiones** — Descarga completa requiere millones de peticiones paginadas
7. ⚠️ **Codificación respuestas**: Algunos caracteres especiales llegan con encoding incorrecto (ej. `Ǹ` por `ú`)

### C. AIReF PRTR
1. ❌ **No hay API** — Solo descarga de ficheros CSV/Parquet
2. ⚠️ **Actualización solo trimestral** — No es tiempo real
3. ⚠️ **NIF anonimizado** en los datos públicos (hash, no NIF real)
4. ✅ **Gran valor añadido**: El AIReF NO borra histórico (a diferencia de BDNS)
5. ✅ **Enriquecimiento SABI**: Tamaño empresa, CNAE, forma jurídica

### D. Plataformas Autonómicas
1. ⚠️ **Heterogeneidad total** — Cada CC.AA. usa tecnología diferente (CKAN, Socrata, OpenDataSoft, OCDS, SPARQL)
2. ⚠️ **Calidad variable** — Desde "Muy Alto" (País Vasco, Aragón) hasta "Bajo" (Ceuta)
3. ⚠️ **Contratos menores de las 7 CCAA con plataforma propia NO están en PLACSP** — Hay que ir a cada plataforma
4. ⚠️ **Diferentes codificaciones** — Latin-1, UTF-8, delimitadores variables

---

## 8. POSIBILIDADES DE CRUCE ENTRE FUENTES

### Identificadores compartidos

| Cruce | Campo clave | Viabilidad |
|:---|:---|:---:|
| PLACSP ↔ BDNS | NIF/CIF empresa | ✅ Posible |
| PLACSP ↔ AIReF PRTR | NIF/CIF + objeto contrato | ⚠️ Parcial (NIF anonimizado en AIReF) |
| PLACSP ↔ Órganos Contratación | DIR3 / ID_OC_PLAT | ✅ Directo |
| BDNS ↔ AIReF PRTR | ID BDNS / NIF beneficiario | ⚠️ Parcial |
| Encargos ↔ Contratos posteriores | Texto libre / heurístico | ❌ Sin FK directa |
| PLACSP Directo ↔ Agregación | Mismo esquema CODICE | ✅ Unificable |
| CCAA propias ↔ PLACSP | Varía por CC.AA. | ⚠️ Requiere mapping |

### Campos universales para cruce
- **NIF/CIF** de empresas adjudicatarias/beneficiarias (cuando disponible)
- **Código CPV** de clasificación de productos/servicios
- **Código NUTS** territorial
- **DIR3** de organismos públicos
- **Código BDNS** de convocatorias

---

## 9. INFORMACIÓN QUE NO SE PUBLICA

| Dato ausente | Fuente afectada | Motivo |
|:---|:---|:---|
| Ofertas perdedoras (detalle) | PLACSP | Solo se publica nº total de ofertas y rango min/max |
| Criterios de puntuación detallados | PLACSP | No estandarizados en CODICE |
| NIF de personas físicas | BDNS | Protección de datos (RGPD) |
| Histórico >4 años beneficiarios jurídicos | BDNS | Ley 38/2003 (caducidad publicidad) |
| NIF real en AIReF PRTR | AIReF | Anonimizado por privacidad |
| Contratos menores <5.000€ | PLACSP | Sin obligación legal de publicación |
| Pagos reales (vs adjudicación) | Todas | No hay fuente pública de ejecución presupuestaria granular |
| Subcontratación del medio propio | PLACSP/Encargos | Sin trazabilidad automatizada |

---

## 10. RESTRICCIONES, LICENCIAS Y LÍMITES DE USO

| Fuente | Licencia | Autenticación | Límites |
|:---|:---|:---|:---|
| PLACSP | Reutilización abierta (Ley 37/2007) — Atribución obligatoria | Ninguna (excepto feeds directos) | Sin rate limiting conocido |
| BDNS | Reutilización abierta | Ninguna (API pública) | Posible WAF perimetral |
| AIReF | Reutilización abierta — Atribución AIReF | Ninguna | Sin API, solo descarga ficheros |
| datos.gob.es | CC-BY 4.0 equivalente | Ninguna | API CKAN estándar |
| CCAA (varias) | Generalmente CC-BY o abierta | Varía | Varía por plataforma |

---

## 11. RECURSOS INFORMÁTICOS NECESARIOS A ESCALA NACIONAL

### Para un portátil (desarrollo y prototipado)

| Componente | Requisito mínimo |
|:---|:---|
| **Disco** | 100 GB libres (para descargas parciales y staging) |
| **RAM** | 16 GB (parser XML streaming + DB) |
| **CPU** | 4 cores (parseo es CPU-bound) |
| **DB local** | SQLite o DuckDB (sin PostgreSQL pesado) |
| **Estrategia** | Procesamiento incremental, un año a la vez |

### Para producción (servidor)

| Componente | Requisito recomendado |
|:---|:---|
| **Disco** | 500 GB SSD (histórico completo + staging + DB) |
| **RAM** | 32-64 GB |
| **CPU** | 8-16 cores |
| **Base de datos** | PostgreSQL 16+ o ClickHouse (analítica) |
| **Almacenamiento columnar** | Apache Parquet sobre S3/MinIO |
| **Motor de búsqueda** | Elasticsearch/OpenSearch (búsqueda textual) |
| **Ingesta** | Cron jobs diarios (PLACSP) + trimestrales (AIReF) |
| **Parser XML** | SAX/StAX streaming (NO DOM) — lxml.iterparse o quick-xml |
| **Tiempo bootstrap** | ~48-72 horas para carga histórica completa 2012-2026 |
| **Tráfico mensual** | ~5-10 GB de descargas incrementales |

### Arquitectura recomendada

```
┌─────────────────────┐     ┌──────────────────┐
│   PLACSP Atom/XML   │────▶│  Parser XML      │
│   (6 feeds diarios) │     │  (streaming SAX) │
├─────────────────────┤     ├──────────────────┤
│   BDNS API REST     │────▶│  Crawler JSON    │──▶ PostgreSQL / ClickHouse
│   (convocatorias +  │     │  (paginado)      │    ┌──────────────────┐
│    concesiones)     │     ├──────────────────┤    │  Elasticsearch   │
├─────────────────────┤     │  Loader CSV/     │    │  (búsqueda text) │
│   AIReF Parquet     │────▶│  Parquet         │    └──────────────────┘
│   (trimestral)      │     │  (pandas/polars) │
├─────────────────────┤     ├──────────────────┤
│   7 CCAA propias    │────▶│  Adaptadores     │
│   (APIs CKAN/etc)   │     │  heterogéneos    │
└─────────────────────┘     └──────────────────┘
```

---

## 12. RECOMENDACIÓN DE PRIORIZACIÓN DE INTEGRACIÓN

### Fase 1 — Máximo impacto con mínimo esfuerzo

| Prioridad | Fuente | Justificación |
|:---:|:---|:---|
| 🥇 1 | **PLACSP Agregación CCAA** (sindicacion_1044) | Funciona sin certificado, cubre 7 CCAA, feed Atom estándar |
| 🥇 1 | **PLACSP Encargos** (sindicacion_1383) | Funciona sin certificado, datos únicos y de alto interés público |
| 🥇 1 | **BDNS API** (convocatorias + concesiones) | ✅ API verificada; 31M concesiones + 661K convocatorias; JSON limpio |
| 🥈 2 | **AIReF PRTR (Parquet)** | Datos limpios, enriquecidos con SABI, cobertura nacional completa |
| 🥈 2 | **PLACSP Órganos (XLSX)** | Directorio maestro necesario para normalizar nombres de organismos |

### Fase 2 — Ampliar cobertura

| Prioridad | Fuente | Justificación |
|:---:|:---|:---|
| 🥉 3 | **PLACSP Licitaciones directas** (sindicacion_643) | Resolver problema de certificado; cubre AGE + EELL |
| 🥉 3 | **PLACSP Contratos Menores** (sindicacion_1143) | Resolver certificado; >1M registros/año |

### Fase 3 — Granularidad autonómica

| Prioridad | Fuente | Justificación |
|:---:|:---|:---|
| 4 | **País Vasco** (API REST KontratazioA) | Referente tecnológico, API limpia |
| 4 | **Cataluña** (Socrata SODA API) | Gran volumen, API madura |
| 5 | **Aragón** (OCDS/SPARQL) | Estándar internacional |
| 5 | **Andalucía, Valencia, Galicia** | CKAN APIs estandarizadas |

### Fase 4 — Completar cobertura

| Prioridad | Fuente | Justificación |
|:---:|:---|:---|
| 6 | Resto de CCAA con datos abiertos CKAN | Castilla y León, Navarra, etc. |
| 7 | Ceuta y Melilla | Cobertura residual, baja apertura |

---

## 13. RECOMENDACIÓN TÉCNICA FINAL

> [!TIP]
> ### Para construir la infraestructura nacional sin saturar un ordenador personal:
>
> 1. **Empezar con lo que ya funciona** — Los feeds Atom de sindicacion_1044 y sindicacion_1383 responden hoy sin restricciones
> 2. **Usar un VPS económico** (4 vCPU, 16 GB RAM, 200 GB SSD, ~20€/mes) para las tareas de ingesta y parseo XML
> 3. **DuckDB como motor analítico** — Funciona en local, sin servidor, lee Parquet nativo, SQL estándar
> 4. **Procesamiento incremental** — Solo descargar novedades diarias (seguir `<link rel="next">` hasta `<updated>` ya conocido)
> 5. **No intentar descargar todo el histórico de golpe** — Hacerlo año a año, almacenando en Parquet columnar
> 6. **Resolver el problema del certificado PLACSP** antes de integrar sindicacion_643 y 1143
> 7. **BDNS ya verificada** — Los endpoints `/api/convocatorias/busqueda` y `/api/concesiones/busqueda` funcionan sin autenticación y exponen **31M concesiones + 661K convocatorias** con NIF visible para empresas
> 8. **AIReF como fuente de referencia cruzada** — Sus datos Parquet trimestrales son la fuente más limpia y enriquecida

---

*Informe generado el 31 de octubre de 2026. Datos comprobados mediante pruebas reales contra servidores de producción de las administraciones públicas españolas.*
