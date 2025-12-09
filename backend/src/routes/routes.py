from flask import Blueprint, request, jsonify, send_file, current_app
from src.utils.redisSave import get_progress, set_progress, destroy_all_progress_keys
import json, math, time, os 
from src.utils.conversionHelper import csv_to_json
from src.main import process_source_target_pair
from concurrent.futures import ThreadPoolExecutor, as_completed
from itertools import product
import pandas as pd
from src.DataBase.databse import *
import multiprocessing
from sqlalchemy import tuple_
# from backend.src.Transformation.Transformation import SemanticTransformationEngine
from src.input.inputData import FileToJson
from src.transformation.data_analyzer import DataFieldAnalyzer
# engine = SemanticTransformationEngine()
app_bp = Blueprint('api', __name__)




@app_bp.route("/progress",methods=["GET"])
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

@app_bp.route('/map_files', methods=['POST'])
def map_files():
    try:
        set_progress("result", 0)
        all_files = request.files.getlist("files")
        print('Uploaded files:', [f.filename for f in all_files])
        metadata_raw = request.form.get("metadata")
        set_progress("result", 0.5)
        if not all_files:
            return jsonify({"error": "No files uploaded"}), 400
        if not metadata_raw:
            return jsonify({"error": "No metadata provided"}), 400

        metadata = json.loads(metadata_raw)
        set_progress("result", 1)

        source_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "source"]
        target_files = [f for f in all_files if f.filename in metadata and metadata[f.filename].get("type") == "target"]

        set_progress("result", 1.5)
        if not source_files or not target_files:
            return jsonify({"error": "Need at least one source and one target file"}), 400

        # --- CSV → JSON ---
        source_data = {}
        for src in source_files:
            c = FileToJson(src)
            source_data[src.filename] = c.to_key_val()
        set_progress("result", 3)

        target_data = {}
        target_mn = {}
        for tgt in target_files:
            c = FileToJson(tgt)
            target_data[tgt.filename] = c.to_key_val()
            target_mn[tgt.filename] = {rec["field_name"]: rec["m/n"] for rec in c.to_meta()}
        set_progress("result", 4.5)

        # --- parallel mapping ---
        pairs = list(product(source_data.items(), target_data.items()))
        set_progress("total_tasks", len(pairs))
        comp = 1
        max_workers = min(8, len(pairs))

        aggregated_by_target = {}
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            for (src_file, src_json), (tgt_file, tgt_json) in pairs:
                progress_key = f'mapping_progress_{comp}'
                future = executor.submit(
                    process_source_target_pair,
                    src_file, src_json, tgt_file, tgt_json, metadata, progress_key
                )
                futures.append(future)
                comp += 1

            for future in as_completed(futures):
                tgt_file, enriched_results = future.result()
                if tgt_file not in aggregated_by_target:
                    aggregated_by_target[tgt_file] = {}
                for tgt_key, mappings in enriched_results.items():
                    if tgt_key not in aggregated_by_target[tgt_file]:
                        aggregated_by_target[tgt_file][tgt_key] = []
                    aggregated_by_target[tgt_file][tgt_key].extend(mappings)

        # --- build final_result ---
        final_result = {}
        for tgt_file in target_data.keys():
            tgt_meta = metadata[tgt_file]
            tgt_msg_name = tgt_meta["message_name"]
            tgt_json = target_data[tgt_file]
            final_result[tgt_msg_name] = {}

            for tgt_key, mappings in aggregated_by_target.get(tgt_file, {}).items():
                target_value = tgt_json.get(tgt_key, "")
                if pd.isna(target_value) or (isinstance(target_value, float) and math.isnan(target_value)):
                    target_value = ""

                entry = {
                    "target_key": tgt_key,
                    "target_value": target_value,
                    "target_m_n": target_mn[tgt_file].get(tgt_key, "")
                }

                # --- build scored list ---
                scored = []
                for m in sorted(mappings, key=lambda x: x["final_score"], reverse=True):
                    src_file_name = m["source_file"]
                    src_key = m["source_key"]
                    src_json = source_data.get(src_file_name, {})
                    source_value = src_json.get(src_key, "")
                    if pd.isna(source_value) or (isinstance(source_value, float) and math.isnan(source_value)):
                        source_value = ""

                    scored.append({
                        "final_score": m["final_score"],
                        "source_message": m["source_message"],
                        "source_key": m["source_key"],
                        "source_value": source_value,
                        "source_file": m["source_file"],
                        "source_country": m["source_country"],
                        "source_domain": m["source_domain"],
                        "source_system": m["source_system"]
                    })

                # ---------- PAST-MAPPING BONUS ----------
                with SessionLocal.begin() as db:
                    rows = db.query(PastMapping).filter(
                        tuple_(PastMapping.target_key, PastMapping.source_key).in_(
                            [(tgt_key, d["source_key"]) for d in scored]
                        )
                    ).all()
                    bonus_map = {(r.target_key, r.source_key): r.number for r in rows}

                    for d in scored:
                        n = bonus_map.get((tgt_key, d["source_key"]), 0)
                        if n == 0:
                            continue
                        if n >= 4:
                            d["final_score"] = 1.0
                        else:
                            d["final_score"] = min(d["final_score"] + 0.2 * n, 1.0)
                        d["source_message"] += " (based on past mapping)"

                    # re-sort by updated score
                    scored.sort(key=lambda x: x["final_score"], reverse=True)

                # store top-3
                for idx, d in enumerate(scored[:3], start=1):
                    entry[f"key{idx}"] = d

                final_result[tgt_msg_name][tgt_key] = entry

        with open("final_result.json", "w", encoding="utf-8") as f:
            json.dump(final_result, f, indent=4, ensure_ascii=False)

        time.sleep(1)
        destroy_all_progress_keys()
        return jsonify(final_result), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
    

    
# ----------  GET /api/mappings  ----------
@app_bp.route("/mappings", methods=["GET"])
def get_mappings():
    with SessionLocal() as db:
        rows = db.query(Metadata).order_by(Metadata.created_at.desc()).all()
        return jsonify([row_to_json(r) for r in rows]), 200


# ----------  POST /api/mappings  ----------
@app_bp.route("/mappings", methods=["POST"])
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
            analyzer = DataFieldAnalyzer(pair)
            res = analyzer.analyze_row()
            db.add(Mapping(
                metadata_id=meta.id,
                source_massage=pair["sourceMassage"],
                source_key=pair["sourceKey"],
                source_value=pair["sourceValue"],
                target_key=pair["targetKey"],
                target_massage=pair["targetMassage"],
                target_value=pair["targetValue"],
                transformation_needed=res.get("transformation_needed"),
                transformation_comments=res.get("transformation_type")+ '::' +res.get("transformation_reason"),
            ))

        return jsonify(row_to_json(meta)), 201

# ----------  PUT /api/mappings/<id>  ----------
@app_bp.route("/mappings/<mapping_id>", methods=["PUT"])
def update_mapping(mapping_id):
    from uuid import UUID                       # 1.  UUID constructor
    from sqlalchemy.exc import SQLAlchemyError

    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "No data provided"}), 400

    # Optional: allow client to omit id in body and use the URL segment
    if "id" not in payload:
        payload["id"] = mapping_id

    try:
        payload_id = UUID(payload["id"])        # 2.  str -> UUID
    except ValueError:
        return jsonify({"error": "Invalid UUID format"}), 400

    with SessionLocal() as db:
        # 3.  Fetch with proper UUID object
        mapping = db.query(Mapping).filter(Mapping.id == payload_id).first()
        if not mapping:
            return jsonify({"error": "Mapping not found"}), 404

        # -------------------------
        #  RUN ANALYZER
        # -------------------------
        analyzer = DataFieldAnalyzer(payload)
        res = analyzer.analyze_row()

        transformation_needed = res.get("transformation_needed")
        transformation_comments = (
            f"{res.get('transformation_type')}::{res.get('transformation_reason')}"
        )

        # -------------------------
        #  UPDATE FIELDS
        # -------------------------
        fields = {
            "source_key": "sourceKey",
            "source_massage": "sourceMassage",
            "source_value": "sourceValue",
            "target_key": "targetKey",
            "target_massage": "targetMassage",
            "target_value": "targetValue",
        }

        for model_field, json_field in fields.items():
            if json_field in payload:
                setattr(mapping, model_field, payload[json_field])

        # -------------------------
        #  UPDATE TRANSFORMATION FIELDS
        # -------------------------
        mapping.transformation_needed = transformation_needed
        mapping.transformation_comments = transformation_comments

        try:
            db.commit()
            db.refresh(mapping)
        except SQLAlchemyError as e:
            db.rollback()
            return jsonify({"error": "Database update failed", "details": str(e)}), 500

        return ('save successfully'), 200

# ----------  DELETE /api/mappings/<id>  ----------
@app_bp.route("/mappings/<mapping_id>", methods=["DELETE"])
def delete_mapping(mapping_id):
    with SessionLocal.begin() as db:
        meta = db.get(Metadata, mapping_id)
        if not meta:
            return jsonify({"error": "Mapping not found"}), 404
        db.delete(meta)
        return jsonify({"success": True}), 200


# ----------  health ----------
@app_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy"}), 200



@app_bp.route('/transformation', methods=['POST'])
def transform():
    """
    Expects: { "mappings": [
        { targetKey: str, targetValue: str, sourceKey: str, sourceValue: str },
        ...
    ]}
    Returns: { "results": [ { success, original_value, transformed_value, error, plan }, … ] }
    """
    data = request.get_json(force=True)
    mappings = data.get("mappings", [])
    print('mapping',mappings)
    time.sleep(5)
    results = []
    for row in mappings:
        # build synthetic field names from keys so the engine has a hint
        src_field = row["sourceKey"] or "unknown"
        src_value = row["sourceValue"]
        tgt_field = row["targetKey"] or "unknown"
        tgt_value = row["targetValue"]
  
        analyzer = DataFieldAnalyzer(row)
        res = analyzer.analyze_row()
        # res = engine.execute_transformation(
        #     source_field=src_field,
        #     source_value=src_value,
        #     target_field=tgt_field,
        #     target_value=tgt_value,
        # )

        results.append(res)

    safe = json.loads(json.dumps(results, default=str))
    print(safe)
    return jsonify({"results": safe}),200

@app_bp.route('/editedMapping', methods=['POST'])
def save_edited_mappings():

    data = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"error": "Empty payload"}), 400

    try:
        with SessionLocal.begin() as db:          # gives you an active session + transaction
            for target_full_key, source_full_key in data.items():
                source_key = (
                    source_full_key.split("::", 1)[1]
                    if "::" in source_full_key
                    else "NONE"
                )
                target_key = (
                    target_full_key.split("::", 1)[1]
                    if "::" in target_full_key
                    else target_full_key
                )

                existing = (db.query(PastMapping)
                           .filter_by(source_key=source_key, target_key=target_key)
                           .with_for_update()
                           .first())

                if existing:
                    existing.number += 1
                else:
                    db.add(PastMapping(
                        source_key=source_key,
                        target_key=target_key,
                        number=1
                    ))
        # commit is automatic when exiting the context manager
        return jsonify({"status": "saved"}), 200
    except Exception as exc:
        current_app.logger.exception("save_edited_mappings failed")
        return jsonify({"error": str(exc)}), 500
    
    
    
    
    """
    Expects JSON:  { "targetMessage::targetKey": "sourceMessage::sourceKey", ... }
    If the pair (source_key, target_key) already exists → increment `number`.
    Otherwise insert with `number = 0`.
    """
    data: dict = request.get_json(silent=True) or {}
    if not data:
        return jsonify({"error": "Empty payload"}), 400

    session = db.session
    try:
        for target_full_key, source_full_key in data.items():
            # split the composite strings
            try:
                source_msg, source_key = source_full_key.split("::", 1)
            except ValueError:          # "NONE" or malformed
                source_msg, source_key = "NONE", "NONE"

            # look for an existing row
            existing = (session.query(PastMapping)
                        .filter_by(source_key=source_key, target_key=target_full_key)
                        .with_for_update()          # avoid race
                        .first())

            if existing:
                existing.number += 1
            else:
                new_row = PastMapping(
                    source_key=source_key,
                    target_key=target_full_key,
                    number=0
                )
                session.add(new_row)

        session.commit()
        return jsonify({"status": "saved"}), 200
    except Exception as exc:
        session.rollback()
        current_app.logger.exception("save_edited_mappings failed")
        return jsonify({"error": str(exc)}), 500
    finally:
        session.close()