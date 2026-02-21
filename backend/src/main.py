
import concurrent.futures
import csv
import sys, os 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.utils.helper import *

from src.transformation.valTag import SimpleFieldSimilarityScorer
scorer = SimpleFieldSimilarityScorer()
from src.utils.mapping_methods import *
from src.transformation.data_analyzer import DataFieldAnalyzer
from src.utils.catogry import CatogryScore
# def tarnsform_data(source_dict, target_list, data_mapping):
import time

from src.utils.redisSave import set_progress

def get_data_mapping(catScore,target_category,source_category,source_dict, target_dict,progress_key, full_mapping=True, save_csv=True):

    keys = {**source_dict, **target_dict}
    descriptions, format_info = generate_description_format(keys)


    if descriptions == None:
        return format_info
    else:
        result = {}

       
        

        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = []
            

            for tgt_key, tgt_val in target_dict.items(): 
                target_found = match_any_category(target_category,tgt_key) 
                if target_found[0]:
                
                    scores_dict = catScore[target_found[1]]   # dict: {source_cat: score}
                    # Get only the scores
                    scores = list(scores_dict.values())
                    if len(scores) < 2:
                        highest = scores[0] if scores else None
                        second_highest = None
                        diff = None
                        diffY = True
                    else:
                        # Sort descending
                        scores_sorted = sorted(scores, reverse=True)
                        highest = scores_sorted[0]
                        second_highest = scores_sorted[1]
                        diff = highest - second_highest # key + value
                        diffY = diff > 0.2
              
                    
                for src_key, src_val in source_dict.items():
                    bothCatogry = False
                    source_found =  match_any_category(source_category,src_key)
                 
                    
                        
                    if source_found[0] and target_found[0]:
                        
                        catS = catScore[target_found[1]][source_found[1]]


                    if source_found[0] and target_found[0] and catS == highest and catS > 0.5 and diffY:
                        bothCatogry = True
                      
                        future = executor.submit(
                            compute_score,
                            
                            source_found[2],
                            target_found[2],
                            emb,
                            groq
                        )
                    # elif source_found[0] and target_found[0]:

                    #     future = executor.submit(
                    #         compute_score,
                    #         target_found[2],
                    #         source_found[2],
                    #         emb,
                    #         groq
                    #     )
                    # elif source_found[0] and not target_found[0]:
                    #     catDa = executor.submit(
                    #         compute_score,
                    #         tgt_key,
                    #         source_found[1],
                    #         emb,
                    #         groq
                    #     )
                    #     _ , fuzzy, semantic, synonym = catDa.result()
                    #     llm_score = llm_descriptions_similarity(tgt_key, src_key, descriptions, emb)
                    #     catS = (
                    #             0.10 * semantic +
                    #             0.10 * fuzzy +
                    #             0.30 * synonym +
                    #             0.50 * llm_score
                    #         )
                    #     future = executor.submit(
                    #         compute_score,
                    #         tgt_key,
                    #         source_found[2],
                    #         emb,
                    #         groq
                    #     )
                    # elif not source_found[0] and target_found[0]:
                    #     catDa = executor.submit(
                    #         compute_score,
                    #         target_found[1],
                    #         src_key,
                    #         emb,
                    #         groq
                    #     )
                    #     _ , fuzzy, semantic, synonym = catDa.result()
                    #     llm_score = llm_descriptions_similarity(tgt_key, src_key, descriptions, emb)
                    #     catS = (
                    #             0.10 * semantic +
                    #             0.10 * fuzzy +
                    #             0.30 * synonym +
                    #             0.50 * llm_score
                    #         )
                     
                    #     future = executor.submit(
                    #         compute_score,
                    #         target_found[2],
                    #         src_key,
                    #         emb,
                    #         groq
                    #     )
                    
                    else:
                        catS = 0
                        future = executor.submit(
                            compute_score,
                            
                            src_key,
                            tgt_key,
                            emb,
                            groq
                            
                        )
                    futures.append((tgt_key, tgt_val, src_key, src_val, future,catS,bothCatogry))
            
            # Collect results
            import threading
            import time

            # --- Progress tracking setup ---
            total_tasks = len(futures)
            completed = 0
            lock = threading.Lock()

            

            def write_progress():
                while True:
                    with lock:
                        percent = (completed / total_tasks) * 95
                    set_progress(progress_key, percent)
                   
                    if completed >= total_tasks:
                        break
                    time.sleep(1)

            progress_thread = threading.Thread(target=write_progress, daemon=True)
            progress_thread.start()
            for tgt_key, tgt_val, src_key, src_val, future, catS,bothCatogry in futures:
              
                
                row = {
                        "sourceKey": src_key,
                        "sourceValue": src_val,
                        "targetKey": tgt_key,
                        "targetValue": tgt_val
                    }
                analyser = DataFieldAnalyzer(row)
                data = analyser.analyze_row()
           
                valScore = scorer.calculate_similarity(data['source_value_tag'], data['target_value_tag'])
            
                _ , fuzzy, semantic, synonym = future.result()
                
                llm_score = llm_descriptions_similarity(tgt_key, src_key, descriptions, emb)
                with lock:
                    completed += 1
                if tgt_key not in result:
                    result[tgt_key] = []
                
                

                if catS > 0 :
                    if bothCatogry:
                        final_score = (
                            0.10 * semantic +
                            0.10 * fuzzy +
                            0.30 * synonym +
                            0.50 * llm_score
                        )*valScore['similarity_score']/100*0.8 + catS*0.2
                    # else :
                    #     final_score = (
                    #         0.10 * semantic +
                    #         0.10 * fuzzy +
                    #         0.30 * synonym +
                    #         0.50 * llm_score
                    #     )*valScore['similarity_score']/100*0.3 + catS*0.7
                else :
                    final_score = (
                        0.10 * semantic +
                        0.10 * fuzzy +
                        0.30 * synonym +
                        0.50 * llm_score
                    )*valScore['similarity_score']/100 
              
                result[tgt_key].append({
                    "source_key": src_key,     # 🔄 replaced
                    "fuzzy": fuzzy,
                    "semantic": semantic,
                    "synonym": synonym,
                    "llm_score": llm_score,
                    'Value_Score':valScore['similarity_score']/100,
                    "final_score": final_score
                })
        
       
        return result



# Define this function at MODULE LEVEL (outside the route)
def process_source_target_pair(catScore,target_category,source_category,src_file, src_json, tgt_file, tgt_json, metadata,progress_key ):
    """Process a single source-target pair"""
    src_meta = metadata[src_file]
    mapping_result = get_data_mapping(catScore,target_category,source_category,src_json, tgt_json,progress_key)
    
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
                "source_system": src_meta["system"],
                "source_location": src_meta.get("location")
            })
            enriched_mappings.append(m_copy)
        enriched_results[tgt_key] = enriched_mappings
    
    return tgt_file, enriched_results

if __name__ == '__main__':
    source_dict = {
        "BLNumber": "BL123456789",
        "ContainerNumber": "CONT9876543",
        "DateOfMovement": "2025-08-20",
        "PortOfDischarge": "SGSIN",  # Singapore
        "PortOfLoading": "INMUM",    # Mumbai
        "SealNumber": "SEAL56789",
        "ShippingLineID": "SL001",
        "VesselID": "VESSEL9988",
        "VGM": 24500,  # Verified Gross Mass in KG
        "VoyageID": "VOY20250820",
        "ShipperCode": "SHIP123",
        "ShipperName": "Global Logistics Pvt Ltd",
        "OOGHeight": 2.5,  # meters
        "OOGFront": 1.2,
        "OOGBack": 1.1,
        "OOGLeft": 0.8,
        "OOGRight": 0.9,
        "Loading Time": "2 hrs",
        "vesselDate": "27/10/1997"
    }
        
    target_dict = {
        "Vehicle Date": "27th Oct 1997", 
        "LoadTiming": "180 mins",
        "Shipping Bill No": "SBN56789",
        "Container No.": "CONT1122334",
        "Sailing date and time of the Port": "2025-09-10 14:30:00",
        "Port Of Discharge": "USLAX",  # Los Angeles
        "Port Of Loading": "SGSIN",    # Singapore
        "Custom’s Container Seal Number": "CSEAL445566",
        "Shipping Container Seal Number": "SEAL778899",
        "Shipping Line Code": "MAEU",  # Maersk Line
        "Call Sign/Vessel Code": "9V1234",
        "Weight Quantity": 27800,      # in KG
        "Voyage Number": "VOY998877",
        "Shipping Agent Code": "SAC001",
        "Shipping Agent": "Oceanic Shipping Ltd.",
        "Over Dimension Height": 3.2,  # meters
        "Dimension Code": "DIM45HQ",
        "Over Dimension Width": 2.8,   # meters
        "Over Dimension Length": 13.5  # meters
    }
    result = get_data_mapping(source_dict, target_dict)
    target = transform_data(source_dict, list(target_dict.keys()), result)
    print(result)
