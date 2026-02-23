from sqlalchemy import (
    create_engine, Column, String, DateTime, Integer, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
import uuid
from datetime import datetime
from typing import List, Dict, Any
# DATABASE_URL = "postgresql+psycopg2://indraj:indraj@10.11.87.8:5432/maitri_db"
import platform
import os
from dotenv import load_dotenv
load_dotenv()
db_url = (os.getenv("DATABASE_URL") or "").strip()
if not db_url:
    if platform.system() == "Windows":
        db_url = "sqlite:///data/mappings.db"
    else:
        db_url = "postgresql+psycopg2://indraj:indraj@10.11.87.8:5432/maitri_db"
DATABASE_URL = db_url

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()

# ------------------------------------------------------------------
# 2. SQLAlchemy models  (fixed name clash)
# ------------------------------------------------------------------
class Metadata(Base):
    __tablename__ = "mapping_metadata"

    id = Column(String, primary_key=True)  # keep original string id
    source_country = Column(String(50), nullable=False)
    source_domain  = Column(String(50), nullable=False)
    source_system  = Column(String(100), nullable=False)
    source_location = Column(String(100), nullable=True)
    target_country = Column(String(50), nullable=False)
    target_domain  = Column(String(50), nullable=False)
    target_system  = Column(String(100), nullable=False)
    target_location = Column(String(100), nullable=True)
    mapping_count  = Column(Integer, nullable=False)
    created_at     = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at     = Column(DateTime, default=datetime.utcnow,
                            onupdate=datetime.utcnow, nullable=False)

    mappings = relationship("Mapping", back_populates="meta",
                            cascade="all, delete-orphan")


class Mapping(Base):
    __tablename__ = "mapping"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metadata_id = Column(String, ForeignKey("mapping_metadata.id", ondelete="CASCADE"),
                         nullable=False)
    source_key = Column(String, nullable=True)
    source_massage = Column(String, nullable=True)
    source_value = Column(String, nullable=True)
    target_massage = Column(String, nullable=False)
    target_key = Column(String, nullable=False)
    target_value = Column(String, nullable=True)
    transformation_needed = Column(String, nullable=True)
    transformation_comments = Column(String, nullable=True)
    meta = relationship("Metadata", back_populates="mappings")



class PastMapping(Base):
    __tablename__ = "past_mapping"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_key = Column(String, nullable=False)
    target_key = Column(String, nullable=False)
    number = Column(Integer, nullable=False)
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
        "sourceLocation": meta.source_location,
        "targetCountry": meta.target_country,
        "targetDomain":  meta.target_domain,
        "targetSystem":  meta.target_system,
        "targetLocation": meta.target_location,
        "mappingCount":  meta.mapping_count,
        "approvedMappings": [
            {"sourceKey": m.source_key, "targetKey": m.target_key, 
             'id':m.id,
             "sourceMassage": m.source_massage,
             "targetMassage": m.target_massage,
             "transformationNeeded": m.transformation_needed,
             "transformationComments": m.transformation_comments,
             "targetValue": m.target_value,
             "sourceValue": m.source_value}
            for m in meta.mappings
        ]
    }
