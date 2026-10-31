from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.config import settings
from app.db import SessionLocal, init_db
from app.services.seed import seed_reference_data


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        seed_reference_data(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="API de Lapsoe Machinery — ETAPA 1. Sin cifras inventadas; fuentes verificadas.",
    lifespan=lifespan,
)

# Allow configured origins + any *.duckdns.org (public deploy)
_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins if _origins else ["*"],
    allow_origin_regex=r"https?://([a-z0-9-]+\.)?duckdns\.org",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "docs": "/docs",
        "health": "/api/health",
        "stage": "1",
    }