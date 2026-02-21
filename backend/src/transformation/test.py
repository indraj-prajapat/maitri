
import concurrent.futures
import csv
import sys, os 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..",'..')))
from src.utils.helper import *

from src.transformation.valTag import SimpleFieldSimilarityScorer
scorer = SimpleFieldSimilarityScorer()
from src.utils.mapping_methods import *
from src.transformation.data_analyzer import DataFieldAnalyzer
from src.utils.catogry import CatogryScore
# def tarnsform_data(source_dict, target_list, data_mapping):
import time

from src.utils.redisSave import set_progress

def test(source_dict , target_dict):
    keys = {**source_dict, **target_dict}
    descriptions, format_info = generate_description_format(keys)
    row = {
        "sourceKey": list(source_dict.keys())[0],
        "sourceValue": list(source_dict.values())[0],
        "targetKey": list(target_dict.keys())[0],
        "targetValue": list(target_dict.values())[0],
    }
    print(row)
    analyser = DataFieldAnalyzer(row)
    data = analyser.analyze_row()

    valScore = scorer.calculate_similarity(data['source_value_tag'], data['target_value_tag'])
    print('valScore',valScore)
    # print('====')
    print(descriptions)
    for tgt_key , tgt_val in target_dict.items():
        for src_key, src_val in source_dict.items():

            llm_score = llm_descriptions_similarity(tgt_key, src_key, descriptions, emb)
            _ , fuzzy, semantic, synonym = compute_score(src_key=src_key,tgt_key=tgt_key , emb=emb , groq=groq)
            score = (
                                0.10 * semantic +
                                0.10 * fuzzy +
                                0.30 * synonym +
                                0.50 * llm_score
                            )*valScore['similarity_score']/100
            print('+++++++++++++++++++++')
            print(tgt_key,' ----->>',src_key)
            print('llm score',llm_score)
            print('fuzzy score', fuzzy)
            print('semantic score', semantic)
            print('synonym score', synonym)
            print('final score',score)
            print('++++++++++++++++++++')



if __name__ == '__main__':
    target_dict = {
        'Status': 'I',
        
    }

    source_dict = {
        'containerCategoryStatus': 'F',
        
        
    }
    test(source_dict,target_dict)




#     {'sourceKey': 'STATUS', 'sourceValue': 'F', 'targetKey': 'containerCategoryStatus', 'targetValue': 'I'}
# valScore {'similarity_score': 100, 'source_tag': 'string_category_code', 'target_tag': 'string_category_code', 'source_category': 'string', 'target_category': 'string', 'match_type': 'EXACT_MATCH', 'explanation': 'Perfect match: both are string_category_code', 'has_null_like': False}
# {'STATUS': 'Current status of an item.', 'containerCategoryStatus': 'Category status of a container.'}
# s_count {'code': 1, 'status': 1}
# t_count {'status': 1}
# LLM planty 0.4
# LLM Score 0.4313926025231679
# fuzzy pelanty 1.0
# Simentic pelanty 1.0
# fuzzy pelanty 0.4666666666666667
# Simentic pelanty 0.4666666666666667
# synonium planty 1.0
# +++++++++++++++++++++
# containerCategoryStatus  ----->> STATUS
# llm score 0.17255704100926716
# fuzzy score 0.34651668213471554
# semantic score 0.4019795307863512
# synonym score 1.0
# final score 0.4611281417967403
# ++++++++++++++++++++
# (venv) (base) PS A:\AIT\maitri\matri\backend> python .\src\transformation\test.py
# {'sourceKey': 'containerCategoryStatus', 'sourceValue': 'I', 'targetKey': 'STATUS', 'targetValue': 'F'}
# valScore {'similarity_score': 100, 'source_tag': 'string_category_code', 'target_tag': 'string_category_code', 'source_category': 'string', 'target_category': 'string', 'match_type': 'EXACT_MATCH', 'explanation': 'Perfect match: both are string_category_code', 'has_null_like': False}
# {'containerCategoryStatus': 'Current status of the container category.', 'STATUS': 'Current status of the item.'}
# s_count {'status': 1}
# t_count {'code': 1, 'status': 1}
# LLM planty 0.4
# LLM Score 0.4266877150476569
# fuzzy pelanty 0.4666666666666667
# Simentic pelanty 0.4666666666666667
# fuzzy pelanty 1.0
# Simentic pelanty 1.0
# synonium planty 0.4666666666666667
# +++++++++++++++++++++
# STATUS  ----->> containerCategoryStatus
# llm score 0.17067508601906278
# fuzzy score 0.34651668213471554
# semantic score 0.4019795307863512
# synonym score 0.15555555555555556
# final score 0.20685383096830473
# ++++++++++++++++++++
# (venv) (base) PS A:\AIT\maitri\matri\backend> 