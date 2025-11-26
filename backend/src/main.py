

import concurrent.futures
import csv
import sys, os 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.utils.helper import *
from src.utils.mapping_methods import *
# def tarnsform_data(source_dict, target_list, data_mapping):
import time

from src.utils.redisSave import set_progress

def get_data_mapping(source_dict, target_dict,progress_key, full_mapping=True, save_csv=True):

    keys = {**source_dict, **target_dict}
    descriptions, format_info = generate_description_format(keys)

    # print(descriptions)
    if descriptions == None:
        return format_info
    else:
        result = {}

        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = []
            for tgt_key in target_dict.keys():   # 🔄 Outer loop on target
                for src_key in source_dict.keys():
                    futures.append((tgt_key, executor.submit(compute_score, tgt_key, src_key, emb, groq)))
            
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
            for tgt_key, future in futures:
             
                src_key, fuzzy, semantic, synonym = future.result()
                
                llm_score = llm_descriptions_similarity(tgt_key, src_key, descriptions, emb)
                with lock:
                    completed += 1
                if tgt_key not in result:
                    result[tgt_key] = []
                
                final_score = (
                    0.10 * semantic +
                    0.10 * fuzzy +
                    0.30 * synonym +
                    0.50 * llm_score
                )

                result[tgt_key].append({
                    "source_key": src_key,     # 🔄 replaced
                    "fuzzy": fuzzy,
                    "semantic": semantic,
                    "synonym": synonym,
                    "llm_score": llm_score,
                    "final_score": final_score
                })
        
        
        # with open("full_mapping.json", "w") as f:
        #     json.dump(result, f, indent=4)

        # filtered_result = {}
        # for tgt_key, matches in result.items():
        #     if not matches:
        #         continue
        #     # pick the one with max final_score
        #     best_match = max(matches, key=lambda x: x["final_score"])
        #     filtered_result[tgt_key] = best_match
        
        # with open("_mapping.json", "w") as f:
        #     json.dump(filtered_result, f, indent=4)
        
        # data_mapping = {}
        # for key, values in filtered_result.items():
        #     data_mapping[key] = {"source": values["source_key"], "target_format": format_info[key]['format'], "source_format": format_info[values["source_key"]]['format']}
        # # print(filtered_result)

        # with open("data_mapping.json", "w") as f:
        #     json.dump(data_mapping, f, indent=4)
        
        # # ✅ Save results into CSV
        # if save_csv:
        #     with open("mapping_results.csv", mode="w", newline="", encoding="utf-8") as file:
        #         writer = csv.writer(file)

        #         # Write header
        #         writer.writerow(["Target Key", "Source Key", "Fuzzy", "Semantic", "Synonym", "LLM Score", "Final Score"])

        #         # Write each row
        #         for tgt_key, mappings in result.items():
        #             for m in mappings:
        #                 writer.writerow([
        #                     tgt_key,
        #                     m["source_key"],   # 🔄 replaced
        #                     round(m["fuzzy"], 4),
        #                     round(m["semantic"], 4),
        #                     round(m["synonym"], 4),
        #                     round(m["llm_score"], 4),
        #                     round(m["final_score"], 4)
        #                 ])

        # return result if full_mapping else data_mapping
        return result


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
