from src.DataBase.databse import *
from uuid import UUID
from flask import jsonify
from src.transformation.data_analyzer import DataFieldAnalyzer
def datahelper(payload):
    try:
        payload_id = UUID(payload["id"])        # 2.  str -> UUID
    except ValueError:
        return jsonify({"error": "Invalid UUID format"}), 400
    print("payload_id",payload_id)
    with SessionLocal() as db:
        # 3.  Fetch with proper UUID object
        mapping = db.query(Mapping).filter(Mapping.id == payload_id).first()
        if not mapping:
            return jsonify({"error": "Mapping not found"}), 404

        mainId = mapping.metadata_id
        metadata = db.query(Metadata).filter(Metadata.id == mainId).first()
    source_country = metadata.source_country
    source_domain = metadata.source_domain
    source_port = metadata.source_system
    source_location = getattr(metadata, "source_location", None)
    source_key = payload.get("sourceKey")
    source_massage = payload.get("sourceMassage")
    source_value = payload.get("sourceValue")

    target_country = metadata.target_country
    target_domain = metadata.target_domain  
    target_port = metadata.target_system
    target_location = getattr(metadata, "target_location", None)
    target_massage = payload.get("targetMassage")
    target_key = payload.get("targetKey")
    target_value = payload.get("targetValue")
    print("source_value",source_value,'source_key',source_key,'source_country',source_country)
    print("target_value",target_value,'target_key',target_key,'target_country',target_country)

    # return all ablove in dictionary
    return {"source_country":source_country,"source_domain":source_domain,
            "source_port":source_port,"source_location":source_location,"source_key":source_key,
            "source_massage":source_massage,"source_value":source_value,"target_country":target_country,
            "target_domain":target_domain,"target_port":target_port,"target_location":target_location,"target_massage":target_massage,
            "target_key":target_key,"target_value":target_value}



def transformation_helper(payload):
    analyzer = DataFieldAnalyzer(payload)
    res = analyzer.analyze_row()
    print("analyzer result in save route",res)

    transformation_needed = res.get("transformation_needed")
    transformation_details = res.get('transformation_type') + "::" + res.get('transformation_reason')

    return transformation_needed, transformation_details


def deleteHelper(id):
    with SessionLocal.begin() as db:
       
        metadata = db.query(Metadata).filter(Metadata.id == id).first()

        return metadata
