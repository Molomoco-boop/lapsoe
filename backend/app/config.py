from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "data"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Lapsoe Machinery API"
    environment: str = "development"
    database_url: str = f"sqlite:///{(DATA_DIR / 'db' / 'observatorio.sqlite').as_posix()}"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    http_timeout_seconds: float = 60.0
    user_agent: str = "LapsoeMachinery/0.1 (+research; contact: local-dev)"

    # Verified endpoints only (walkthrough + 2026-10-31 probes)
    placsp_aggregated_atom: str = (
        "https://contrataciondelsectorpublico.gob.es/sindicacion/"
        "sindicacion_1044/PlataformasAgregadasSinMenores.atom"
    )
    placsp_emp_atom: str = (
        "https://contrataciondelsectorpublico.gob.es/sindicacion/"
        "sindicacion_1383/EMP_SectorPublico.atom"
    )
    placsp_organs_xlsx: str = (
        "https://contrataciondelsectorpublico.gob.es/datosabiertos/OrganosContratacion.xlsx"
    )
    bdns_api_base: str = "https://www.infosubvenciones.es/bdnstrans/api"
    bdns_default_page_size: int = 50
    bdns_max_page_size: int = 200  # conservative for live proxy; API accepts higher

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
DATA_DIR.mkdir(parents=True, exist_ok=True)
(DATA_DIR / "db").mkdir(parents=True, exist_ok=True)
(DATA_DIR / "raw").mkdir(parents=True, exist_ok=True)