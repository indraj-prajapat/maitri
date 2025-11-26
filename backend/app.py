from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import io
import json
import random
from src.main import get_data_mapping
from concurrent.futures import ProcessPoolExecutor
from itertools import product
import multiprocessing
from src.utils.redisSave import get_progress, set_progress,destroy_all_progress_keys
app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins":[ "http://localhost:8080","http://localhost:8081"]}})
# -------------------------------------------------------------
# Utility: Convert CSV to JSON
# -------------------------------------------------------------
def csv_to_json(file):
    """Convert a CSV file into dict: {col1_row1: col2_row1, ...}"""
    df = pd.read_csv(io.StringIO(file.read().decode('utf-8')))
    df = df.dropna(how='all')

    if df.shape[1] < 2:
        raise ValueError(f"CSV file {file.filename} must have at least 2 columns")

    col1, col2 = df.columns[0], df.columns[1]
    result = {}
    for _, row in df.iterrows():
        key = f"{row[col1]}"
        result[key] = row[col2]
    return result


# -------------------------------------------------------------
# Dummy mapping logic (replace with your actual get_data_mapping)
# -------------------------------------------------------------



# -------------------------------------------------------------
# API endpoint
# -------------------------------------------------------------
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import product

# Define this function at MODULE LEVEL (outside the route)
def process_source_target_pair(src_file, src_json, tgt_file, tgt_json, metadata,progress_key ):
    """Process a single source-target pair"""
    src_meta = metadata[src_file]
    mapping_result = get_data_mapping(src_json, tgt_json,progress_key)
    
    # Enrich mappings with source metadata
    enriched_results = {}
    for tgt_key, mappings in mapping_result.items():
        enriched_mappings = []
        for m in mappings:
            m_copy = m.copy()
            m_copy.update({
                "source_message": src_meta["message_name"],
                "source_file": src_file,
                "source_country": src_meta["country"],
                "source_domain": src_meta["domain"],
                "source_system": src_meta["system"]
            })
            enriched_mappings.append(m_copy)
        enriched_results[tgt_key] = enriched_mappings
    
    return tgt_file, enriched_results


import json
import math
import time
@app.route("/api/progress",methods=["GET"])
def get_mapping_progress():
    total_tast_key = "total_tasks"
    
    n =int(get_progress(total_tast_key) )
    final_progres = 0.0
    for i in range(1,n+1):
        progress_key = f'mapping_progress_{i}'
        final_progres += get_progress(progress_key)
        print('progress_key',progress_key,get_progress(progress_key))
    final_progres = final_progres / n + get_progress("result")
    print('result progress',get_progress("result"))
    return {"progress":final_progres}

@app.route('/api/map_files', methods=['POST'])
def map_files():
    try:
        set_progress("result", 0)
        # Get all files (could be multiple)
        all_files = request.files.getlist("files")
        metadata_raw = request.form.get("metadata")
        set_progress("result", 0.5)
        if not all_files:
            return jsonify({"error": "No files uploaded"}), 400
        if not metadata_raw:
            return jsonify({"error": "No metadata provided"}), 400

        metadata = json.loads(metadata_raw)
        set_progress("result", 1)
        # Separate source and target files
        source_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "source"]
        target_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "target"]
        set_progress("result", 1.5)
        if not source_files or not target_files:
            return jsonify({"error": "Need at least one source and one target file"}), 400

        # Convert all source and target CSVs to JSON
        source_data = {}
        for src in source_files:
            source_data[src.filename] = csv_to_json(src)
        set_progress("result", 3)
        target_data = {}
        for tgt in target_files:
            target_data[tgt.filename] = csv_to_json(tgt)
        set_progress("result", 4.5)
        # -------------------------------------------------------------
        # Build final result with parallel processing
        # -------------------------------------------------------------
        final_result = {}

        # Create all source-target pairs
        pairs = list(product(source_data.items(), target_data.items()))
        set_progress("total_tasks", len(pairs))
        print('total tasks:', len(pairs))
        comp = 1
        # Use ThreadPoolExecutor instead of ProcessPoolExecutor
        max_workers = min(8, len(pairs))
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            set_progress("result", 4.9)
            for (src_file, src_json), (tgt_file, tgt_json) in pairs:
                set_progress("result", 5)
                progress_key = f'mapping_progress_{comp}'
                future = executor.submit(
                    process_source_target_pair,
                    src_file, src_json, tgt_file, tgt_json, metadata,progress_key
                )
                futures.append(future)
                comp +=1
            # Aggregate results by target
            aggregated_by_target = {}
            for future in as_completed(futures):
                tgt_file, enriched_results = future.result()
                if tgt_file not in aggregated_by_target:
                    aggregated_by_target[tgt_file] = {}
                
                for tgt_key, mappings in enriched_results.items():
                    if tgt_key not in aggregated_by_target[tgt_file]:
                        aggregated_by_target[tgt_file][tgt_key] = []
                    aggregated_by_target[tgt_file][tgt_key].extend(mappings)
            
            # Final structuring with values
            for tgt_file in target_data.keys():
                tgt_meta = metadata[tgt_file]
                tgt_msg_name = tgt_meta["message_name"]
                tgt_json = target_data[tgt_file]
                
                final_result[tgt_msg_name] = {}
                
                for tgt_key, mappings in aggregated_by_target.get(tgt_file, {}).items():
                    sorted_mappings = sorted(mappings, key=lambda x: x["final_score"], reverse=True)
                    
                    # Get target key value from target JSON
                    target_value = tgt_json.get(tgt_key, "")
                    # Clean NaN values
                    if pd.isna(target_value) or (isinstance(target_value, float) and math.isnan(target_value)):
                        target_value = ""
                    entry = {
                        "target_key": tgt_key,
                        "target_value": target_value,
                       
                    }
                    
                    for idx, m in enumerate(sorted_mappings, start=1):
                        # Get source value from source JSON
                        src_file_name = m["source_file"]
                        src_key = m["source_key"]
                        src_json = source_data.get(src_file_name, {})
                        source_value = src_json.get(src_key, "")
                        if pd.isna(source_value) or (isinstance(source_value, float) and math.isnan(source_value)):
                            source_value = ""
                        entry[f"key{idx}"] = {
                            "final_score": m["final_score"],
                            "source_message": m["source_message"],
                            "source_key": m["source_key"],
                            "source_value": source_value,  # Added source value
                            "source_file": m["source_file"],
                            "source_country": m["source_country"],
                            "source_domain": m["source_domain"],
                            "source_system": m["source_system"]
                        }
                    
                    final_result[tgt_msg_name][tgt_key] = entry
        
        with open("final_result.json", "w", encoding="utf-8") as f:
            json.dump(final_result, f, indent=4, ensure_ascii=False)
        time.sleep(1)
        destroy_all_progress_keys()
        return jsonify(final_result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


import os
import uuid
from datetime import datetime
from typing import List, Dict, Any

from flask import Flask, request, jsonify
from sqlalchemy import (
    create_engine, Column, String, DateTime, Integer, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship, sessionmaker

# ------------------------------------------------------------------
# 1. DB connection
# ------------------------------------------------------------------
# DATABASE_URL = os.getenv(
#     "DATABASE_URL",
#     "postgresql+psycopg2://user:password@localhost:5432/mappingsdb"
# )
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

init_db()


# ----------  GET /api/mappings  ----------
@app.route("/api/mappings", methods=["GET"])
def get_mappings():
    with SessionLocal() as db:
        rows = db.query(Metadata).order_by(Metadata.created_at.desc()).all()
        return jsonify([row_to_json(r) for r in rows]), 200


# ----------  POST /api/mappings  ----------
@app.route("/api/mappings", methods=["POST"])
def create_mapping():
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "No data provided"}), 400

    # basic validation
    required = {"sourceCountry", "sourceDomain", "sourceSystem",
                "targetCountry", "targetDomain", "targetSystem",
                "mappingCount", "approvedMappings"}
    if not required.issubset(payload):
        return jsonify({"error": f"Missing one of {required}"}), 400

    with SessionLocal.begin() as db:
        # 1. metadata row
        meta = Metadata(
            id=payload.get("id") or str(int(datetime.utcnow().timestamp() * 1000)),
            source_country=payload["sourceCountry"],
            source_domain=payload["sourceDomain"],
            source_system=payload["sourceSystem"],
            target_country=payload["targetCountry"],
            target_domain=payload["targetDomain"],
            target_system=payload["targetSystem"],
            mapping_count=payload["mappingCount"],
            created_at=datetime.utcnow(),
        )
        db.add(meta)

        # 2. mapping rows
        for pair in payload["approvedMappings"]:
            db.add(Mapping(
                metadata_id=meta.id,
                source_key=pair["sourceKey"],
                target_key=pair["targetKey"],
            ))

        return jsonify(row_to_json(meta)), 201


# ----------  PUT /api/mappings/<id>  ----------
@app.route("/api/mappings/<mapping_id>", methods=["PUT"])
def update_mapping(mapping_id):
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "No data provided"}), 400

    with SessionLocal.begin() as db:
        meta = db.get(Metadata, mapping_id)
        if not meta:
            return jsonify({"error": "Mapping not found"}), 404

        # update scalar fields
        for col in ("sourceCountry", "sourceDomain", "sourceSystem",
                    "targetCountry", "targetDomain", "targetSystem",
                    "mappingCount"):
            if col in payload:
                setattr(meta, col.lower().replace("country", "_country")
                        .replace("domain", "_domain")
                        .replace("system", "_system")
                        .replace("mappingcount", "mapping_count"), payload[col])

        # replace approvedMappings completely
        meta.mappings = [
            Mapping(source_key=p["sourceKey"], target_key=p["targetKey"])
            for p in payload.get("approvedMappings", [])
        ]
        meta.mapping_count = len(meta.mappings)

        return jsonify(row_to_json(meta)), 200


# ----------  DELETE /api/mappings/<id>  ----------
@app.route("/api/mappings/<mapping_id>", methods=["DELETE"])
def delete_mapping(mapping_id):
    with SessionLocal.begin() as db:
        meta = db.get(Metadata, mapping_id)
        if not meta:
            return jsonify({"error": "Mapping not found"}), 404
        db.delete(meta)
        return jsonify({"success": True}), 200


# ----------  health ----------
@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200


# ------------------------------------------------------------------
# 7. Run
# ------------------------------------------------------------------
if __name__ == "__main__":
    app.run(debug=True)