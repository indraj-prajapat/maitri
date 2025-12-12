# save_bp.py

from flask import Blueprint, request, jsonify, current_app
from sqlalchemy.orm import Session

from sqlalchemy import and_
from src.transformation.data_analyzer import DataFieldAnalyzer

from uuid import uuid4
from datetime import datetime
from src.Save2.database import MainMapping, DetailedMapping, TargetHistory # Assuming models are in the same package
from src.DataBase.databse import *
# It's good practice to get the engine and SessionLocal from your app's factory
# For this example, I'll import them directly.
from src.Save2.database import engine, SessionLocal
from src.Save2.helper import datahelper, transformation_helper, deleteHelper
save_bp = Blueprint('save2', __name__)







@save_bp.route('/mappings2', methods=['POST'])
def save_mappings2():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400

    current_app.logger.info(f"Received data for saving mappings2: {data}")

    # Generate the unique ID for the main mapping
    try:
        main_id = (
            f"{data['sourceCountry']}_{data['sourceDomain']}_{data['sourceSystem']}_"
            f"{data['targetCountry']}_{data['targetDomain']}_{data['targetSystem']}"
        )
        approved_mappings = data.get('approvedMappings', [])
    except KeyError as e:
        return jsonify({"error": f"Missing key in payload: {e}"}), 400

    db: Session = SessionLocal()
    try:
        # --- 1. Find or Create the MainMapping record ---
        main_mapping = db.query(MainMapping).filter(MainMapping.id == main_id).first()

        # Extract unique source and target messages from the payload
        source_massages = list(set(m['sourceMassage'] for m in approved_mappings))
        target_massages = list(set(m['targetMassage'] for m in approved_mappings))

        if main_mapping:
            # UPDATE existing MainMapping
            current_app.logger.info(f"Updating existing MainMapping with id: {main_id}")
            main_mapping.no_of_updates += 1
            main_mapping.last_updated_at = datetime.utcnow()
            main_mapping.total_mapping_count = data['mappingCount']
            # Append new, unique messages
            main_mapping.source_massages = sorted(list(set(main_mapping.source_massages + source_massages)))
            main_mapping.target_massages = sorted(list(set(main_mapping.target_massages + target_massages)))
        else:
            # CREATE new MainMapping
            current_app.logger.info(f"Creating new MainMapping with id: {main_id}")
            main_mapping = MainMapping(
                id=main_id,
                source_country=data['sourceCountry'],
                source_domain=data['sourceDomain'],
                source_port=data['sourceSystem'],
                target_country=data['targetCountry'],
                target_domain=data['targetDomain'],
                target_port=data['targetSystem'],
                total_mapping_count=data['mappingCount'],
                source_massages=source_massages,
                target_massages=target_massages,
            )
            db.add(main_mapping)

        # --- 2. Process DetailedMappings and TargetHistory ---
        for mapping_item in approved_mappings:
            # Find an existing detailed mapping based on target key and message
            existing_detailed = db.query(DetailedMapping).filter(
                DetailedMapping.main_mapping_id == main_id,
                DetailedMapping.target_key == mapping_item['targetKey'],
                DetailedMapping.target_massage == mapping_item['targetMassage'],
                DetailedMapping.status == 'latest'
            ).first()

            if existing_detailed:
                # If source is different, archive the old one and create a new one
                # if (existing_detailed.source_key != mapping_item['sourceKey'] or
                #     existing_detailed.source_massage != mapping_item['sourceMassage'] or
                #     existing_detailed.source_value != mapping_item['sourceValue']):

                    current_app.logger.info(f"Archiving and replacing detailed mapping for target key: {mapping_item['targetKey']}")
                    # Mark the old one as 'edited' or 'archived'
                    existing_detailed.status = 'edited'
                    existing_detailed.updated_at = datetime.utcnow()


                    analyzer = DataFieldAnalyzer(mapping_item)
                    res = analyzer.analyze_row()
                    print("analyzer result in save route",res)
                    transformation_needed = res.get("transformation_needed")
                    transformation_comments = (
                        f"{res.get('transformation_type')}::{res.get('transformation_reason')}"
                    )


                    # Create a new 'latest' detailed mapping
                    new_detailed = DetailedMapping(
                        main_mapping_id=main_id,
                        Ai_Manual = mapping_item['editType'],
                        transformation_needed = transformation_needed,
                        transformation_details = transformation_comments,
                        **_extract_detailed_fields(mapping_item)
                    )
                    db.add(new_detailed)
                    # Also add to history


                    (
                        db.query(TargetHistory).filter(
                            and_(
                                TargetHistory.main_mapping_id == main_id,
                                TargetHistory.target_massage == mapping_item["targetMassage"],
                                TargetHistory.target_key == mapping_item["targetKey"],
                            )
                        ).delete(synchronize_session=False)
                    )



                    history_record = TargetHistory(detailed_mapping=new_detailed,main_mapping_id=main_id,Ai_Manual = mapping_item['editType'], transformation_needed = transformation_needed,
                        transformation_details = transformation_comments,**_extract_detailed_fields(mapping_item))
                    db.add(history_record)
            else:
                # Create a new detailed mapping if it doesn't exist
                current_app.logger.info(f"Creating new detailed mapping for target key: {mapping_item['targetKey']}")
                analyzer = DataFieldAnalyzer(mapping_item)
                res = analyzer.analyze_row()
                print("analyzer result in save route",res)

                transformation_needed = res.get("transformation_needed")
                transformation_comments = (
                    f"{res.get('transformation_type')}::{res.get('transformation_reason')}"
                )
                new_detailed = DetailedMapping(
                    main_mapping_id=main_id,
                    Ai_Manual = mapping_item['editType'],
                    transformation_needed = transformation_needed,
                    transformation_details = transformation_comments,
                    **_extract_detailed_fields(mapping_item)
                )
                db.add(new_detailed)



                
                # Also create the first history record for this new target
                history_record = TargetHistory(detailed_mapping=new_detailed,main_mapping_id=main_id,Ai_Manual = mapping_item['editType'], transformation_needed = transformation_needed,
                        transformation_details = transformation_comments,**_extract_detailed_fields(mapping_item))
                db.add(history_record)

        db.commit()
        return jsonify({"message": "Mappings saved successfully", "id": main_id}), 200

    except Exception as e:
        db.rollback()
        current_app.logger.error(f"Failed to save mappings: {e}", exc_info=True)
        return jsonify({"error": "An internal error occurred"}), 500
    finally:
        db.close()




def _extract_detailed_fields(item: dict) -> dict:
    """Helper function to extract fields for DetailedMapping and TargetHistory."""
    return {
        "target_massage": item['targetMassage'],
        "target_key": item['targetKey'],
        "target_value": item['targetValue'],
        "source_massage": item['sourceMassage'],
        "source_key": item['sourceKey'],
        "source_value": item['sourceValue'],
    }




@save_bp.route("/update2/<mapping_id>", methods=["PUT"])
def update_mapping(mapping_id: str):
    """
    Update or create a detailed mapping inside the bucket identified by
    the natural key (source_country, source_domain, source_port,
    target_country, target_domain, target_port) that is shipped in the payload.
    """
    payload = request.get_json(silent=True)
    if not payload:
        return jsonify({"error": "No data provided"}), 400

    # ensure the path param is present even if caller forgot it in body
    payload.setdefault("id", mapping_id)

    # normalise the payload (you already have this helper)
    data = datahelper(payload)
    transformation_needed, transformation_details = transformation_helper(payload)
    print("data in update route", data)

    # ------------------------------------------------------------------
    # 1.  Locate the MainMapping row that matches the natural key
    # ------------------------------------------------------------------
    db: Session = SessionLocal()
    main = (
        db.query(MainMapping)
        .filter(
            and_(
                MainMapping.source_country == data["source_country"],
                MainMapping.source_domain == data["source_domain"],
                MainMapping.source_port == data["source_port"],
                MainMapping.target_country == data["target_country"],
                MainMapping.target_domain == data["target_domain"],
                MainMapping.target_port == data["target_port"],
            )
        )
        .first()
    )

    if not main:
        return jsonify({"error": "MainMapping bucket not found"}), 404

    main_id = main.id
    now = datetime.utcnow()

    # ------------------------------------------------------------------
    # 2.  Archive existing DetailedMapping (if any)
    # ------------------------------------------------------------------
    existing_detail = (
        db.query(DetailedMapping)
        .filter(
                DetailedMapping.main_mapping_id == main_id,
                DetailedMapping.target_massage == data["target_massage"],
                DetailedMapping.target_key == data["target_key"],
                DetailedMapping.status == "latest",
        ).first()
        
    )

    if existing_detail:
        existing_detail.status = "archived"
        existing_detail.updated_at = now

    # ------------------------------------------------------------------
    # 3.  Insert new DetailedMapping row
    # ------------------------------------------------------------------
    new_detail = DetailedMapping(
        id=str(uuid4()),
        main_mapping_id=main_id,

        target_massage=data["target_massage"],
        target_key=data["target_key"],
        target_value=data["target_value"],

        source_massage=data["source_massage"],
        source_key=data["source_key"],
        source_value=data["source_value"],

        transformation_needed=transformation_needed,
        transformation_details=transformation_details,
        created_at=now,
        updated_at=None,  # brand-new row
        status="latest",
        Ai_Manual="manual",
    )
    db.add(new_detail)

    # ------------------------------------------------------------------
    # 4.  Delete old history rows and insert fresh one
    # ------------------------------------------------------------------
    (
        db.query(TargetHistory).filter(
            and_(
                TargetHistory.main_mapping_id == main_id,
                TargetHistory.target_massage == data["target_massage"],
                TargetHistory.target_key == data["target_key"],
            )
        ).delete(synchronize_session=False)
    )

    new_history = TargetHistory(
        id=str(uuid4()),
        detailed_mapping_id=new_detail.id,
        main_mapping_id=main_id,

        target_massage=data["target_massage"],
        target_key=data["target_key"],
        target_value=data["target_value"],

        source_massage=data["source_massage"],
        source_key=data["source_key"],
        source_value=data["source_value"],

        transformation_needed=transformation_needed,
        transformation_details=transformation_details,
        
        observation_date=now,
        status="latest",
        Ai_Manual="manual",
    )
    db.add(new_history)

    # ------------------------------------------------------------------
    # 5.  Bump counter and timestamps on the parent row
    # ------------------------------------------------------------------
    main.no_of_updates += 1
    main.last_updated_at = now

    # ------------------------------------------------------------------
    # 6.  Commit and respond
    # ------------------------------------------------------------------
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        return jsonify({"error": str(exc)}), 500

    return jsonify({"message": "save successfully"}), 200

    






@save_bp.route("/mappings/<mapping_id>", methods=["DELETE"])
def delete_mapping(mapping_id):
    data = deleteHelper(mapping_id)
    if not data:
        return jsonify({"error": "Mapping not found"}), 404

    db: Session = SessionLocal()
    now = datetime.utcnow()

    # ---------- FIND MAIN BUCKET ----------
    main = (
        db.query(MainMapping)
        .filter(
            and_(
                MainMapping.source_country == data.source_country,
                MainMapping.source_domain == data.source_domain,
                MainMapping.source_port == data.source_system,
                MainMapping.target_country == data.target_country,
                MainMapping.target_domain == data.target_domain,
                MainMapping.target_port == data.target_system,
            )
        )
        .first()
    )

    if not main:
        return jsonify({"error": "MainMapping bucket not found"}), 404

    main_id = main.id

    # ---------- FETCH ALL matching detail rows ----------
    existing_details = (
        db.query(DetailedMapping)
        .filter(
            and_(
                DetailedMapping.main_mapping_id == main_id,
                DetailedMapping.status == "latest",
            )
        )
        .all()
    )

    # ---------- UPDATE THEM ONE BY ONE ----------
    for detail in existing_details:
        detail.status = "deleted"
        detail.Ai_Manual = "manual"
        detail.updated_at = now

    # ---------- UPDATE TargetHistory ----------
    (
        db.query(TargetHistory)
        .filter(
            and_(
                TargetHistory.main_mapping_id == main_id,
                TargetHistory.status == "latest",
            )
        )
        .update({"status": "deleted"}, synchronize_session=False)
    )

    try:
        db.commit()
        return jsonify({"success": True}), 200
    except Exception as exc:
        db.rollback()
        return jsonify({"error": str(exc)}), 500
