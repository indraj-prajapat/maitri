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
from src.Transformation import SemanticTransformationEngine
engine = SemanticTransformationEngine()
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
            db.add(Mapping(
                metadata_id=meta.id,
                source_key=pair["sourceKey"],
                target_key=pair["targetKey"],
            ))

        return jsonify(row_to_json(meta)), 201


# ----------  PUT /api/mappings/<id>  ----------
@app_bp.route("/mappings/<mapping_id>", methods=["PUT"])
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

        res = engine.execute_transformation(
            source_field=src_field,
            source_value=src_value,
            target_field=tgt_field,
            target_value=tgt_value,
        )

        results.append(res)

    safe = json.loads(json.dumps(results, default=str))
    print(safe)
    return jsonify({"results": safe}),200

