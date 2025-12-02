from sqlalchemy import (
    create_engine, Column, String, DateTime, Integer, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import uuid
from datetime import datetime
from typing import List, Dict, Any
DATABASE_URL = "sqlite:///data/mappings.db"

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

# ------------------------------------------------------------------
# 2. SQLAlchemy models  (fixed name clash)
# ------------------------------------------------------------------
class Metadata(Base):
    __tablename__ = "metadata"

    id = Column(String, primary_key=True)  # keep original string id
    source_country = Column(String(50), nullable=False)
    source_domain  = Column(String(50), nullable=False)
    source_system  = Column(String(100), nullable=False)
    target_country = Column(String(50), nullable=False)
    target_domain  = Column(String(50), nullable=False)
    target_system  = Column(String(100), nullable=False)
    mapping_count  = Column(Integer, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at     = Column(DateTime, default=datetime.utcnow,
                            onupdate=datetime.utcnow, nullable=False)

    mappings = relationship("Mapping", back_populates="meta",
                            cascade="all, delete-orphan")


class Mapping(Base):
    __tablename__ = "mapping"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metadata_id = Column(String, ForeignKey("metadata.id", ondelete="CASCADE"),
                         nullable=False)
    source_key = Column(String, nullable=False)
    target_key = Column(String, nullable=False)

    meta = relationship("Metadata", back_populates="mappings")


# ------------------------------------------------------------------
# 3. Ensure tables exist
# ------------------------------------------------------------------
def init_db():
    Base.metadata.create_all(bind=engine)


def row_to_json(meta: Metadata) -> Dict[str, Any]:
    return {
        "id":            meta.id,
        "timestamp":     int(meta.created_at.timestamp() * 1000),
        "sourceCountry": meta.source_country,
        "sourceDomain":  meta.source_domain,
        "sourceSystem":  meta.source_system,
        "targetCountry": meta.target_country,
        "targetDomain":  meta.target_domain,
        "targetSystem":  meta.target_system,
        "mappingCount":  meta.mapping_count,
        "approvedMappings": [
            {"sourceKey": m.source_key, "targetKey": m.target_key}
            for m in meta.mappings
        ]
    }
