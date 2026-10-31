from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Source(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    kind: Mapped[str] = mapped_column(String(64))  # atom | rest | file
    base_url: Mapped[str] = mapped_column(Text)
    coverage_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="verified")  # verified|blocked|deferred
    last_success_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_attempt_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    sync_runs: Mapped[list[SyncRun]] = relationship(back_populates="source")


class SyncRun(Base):
    __tablename__ = "sync_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id"), index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    mode: Mapped[str] = mapped_column(String(32), default="smoke")  # smoke|incremental|full
    status: Mapped[str] = mapped_column(String(32), default="running")  # running|ok|error
    received: Mapped[int] = mapped_column(Integer, default=0)
    inserted: Mapped[int] = mapped_column(Integer, default=0)
    updated: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[int] = mapped_column(Integer, default=0)
    detail: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    checkpoint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    source: Mapped[Source] = relationship(back_populates="sync_runs")


class Organization(Base):
    __tablename__ = "organizations"
    __table_args__ = (UniqueConstraint("external_id", "id_scheme", name="uq_org_ext"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    id_scheme: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # DIR3|ID_OC_PLAT|INVENTE
    name: Mapped[str] = mapped_column(String(512), index=True)
    level: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)  # ESTATAL|AUTONOMICA|LOCAL
    territory: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    nuts_code: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    raw_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nif: Mapped[Optional[str]] = mapped_column(String(32), unique=True, nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(512), index=True)
    nif_is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    match_method: Mapped[str] = mapped_column(String(64), default="exact_nif")  # exact_nif|heuristic
    match_confidence: Mapped[str] = mapped_column(String(32), default="confirmed")
    first_seen_source: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class Contract(Base):
    __tablename__ = "contracts"
    __table_args__ = (
        UniqueConstraint("source_entry_id", name="uq_contract_entry"),
        Index("ix_contracts_folder", "contract_folder_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(String(64), index=True)
    source_entry_id: Mapped[str] = mapped_column(String(512))
    contract_folder_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status_code: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    contracting_body_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    contracting_body_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="EUR")
    territory: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    nuts_code: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    cpv_codes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    procedure_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    contract_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    updated_at_source: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_xml: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class InHouseOrder(Base):
    __tablename__ = "in_house_orders"
    __table_args__ = (UniqueConstraint("source_entry_id", name="uq_emp_entry"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source_id: Mapped[str] = mapped_column(String(64), index=True)
    source_entry_id: Mapped[str] = mapped_column(String(512))
    contract_folder_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    title: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ordering_body_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    ordering_body_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    recipient_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    recipient_nif: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    updated_at_source: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    source_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw_xml: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class GrantCall(Base):
    __tablename__ = "grant_calls"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # BDNS id
    numero_convocatoria: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    fecha_recepcion: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    mrr: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)
    nivel1: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    nivel2: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    nivel3: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    codigo_invente: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    raw_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class GrantAward(Base):
    __tablename__ = "grant_awards"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)  # BDNS id
    cod_concesion: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True)
    fecha_concesion: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    fecha_alta: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    beneficiario_raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    beneficiario_nif: Mapped[Optional[str]] = mapped_column(String(32), nullable=True, index=True)
    beneficiario_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True, index=True)
    nif_is_public: Mapped[bool] = mapped_column(Boolean, default=False)
    instrumento: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    importe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ayuda_equivalente: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    url_br: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    numero_convocatoria: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    id_convocatoria: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    convocatoria: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    nivel1: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    nivel2: Mapped[Optional[str]] = mapped_column(String(128), nullable=True, index=True)
    nivel3: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    codigo_invente: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    id_persona: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True, index=True)
    extracted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    raw_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class CoverageTerritory(Base):
    __tablename__ = "coverage_territories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(16), unique=True)
    name: Mapped[str] = mapped_column(String(128))
    placsp_direct: Mapped[bool] = mapped_column(Boolean, default=False)
    placsp_aggregated: Mapped[bool] = mapped_column(Boolean, default=False)
    own_platform: Mapped[bool] = mapped_column(Boolean, default=False)
    bdns_covered: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    level: Mapped[str] = mapped_column(String(32), default="unknown")  # high|medium|low