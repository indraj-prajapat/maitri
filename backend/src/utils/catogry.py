from collections import Counter
from collections import defaultdict

import sys, os 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..",'..')))
from src.utils.helper import *


from src.utils.mapping_methods import *

def find_categories(strings):
    """
    Extract common prefixes/categories from a list of strings.
    Handles delimiters (., /, _, -) only.
    """
    prefixes = []
    delimiters = ['.', '/', '_', '-']
    
    for s in strings:
        n = len(s)
        last_delimiter_index = -1
        
        # Scan from right to left to find separators
        for i in range(n-1, 0, -1):
            # Check for explicit delimiters
            if s[i] in delimiters and last_delimiter_index == -1:
                last_delimiter_index = i
                break
        
        # Extract prefix if a valid split point was found
        if last_delimiter_index > 0:
            prefix = s[:last_delimiter_index]
            prefixes.append(prefix)
    
    # Count frequency of each prefix
    freq = Counter(prefixes)
    
    # Keep only prefixes that appear at least twice
    categories = [p for p, count in freq.items() if count >= 2]
    
    # Sort by length (longest first) for better matching
    categories.sort(key=lambda x: (-len(x), x))
    
    return categories




def CatogryScore(target_category, source_category):
    # target_keys = list(target_dict.keys())
    # source_keys = list(source_dict.keys())
    # target_category = find_categories(target_keys)
    # source_category = find_categories(source_keys)
    category_scores = defaultdict(dict)

    if target_category and source_category:
        keys = list(set(target_category + source_category))
        descriptions, format_info = generate_description_format(keys)

        for tgt_cat in target_category:
            for src_cat in source_category:

                # -------- core scores --------
                _, fuzzy, semantic, synonym = compute_score(
                    src_cat,
                    tgt_cat,
                    emb,
                    groq
                )

                llm_score = llm_descriptions_similarity(
                    tgt_cat,
                    src_cat,
                    descriptions,
                    emb
                )

                # -------- final weighted score --------
                final_score = (
                    0.10 * semantic +
                    0.10 * fuzzy +
                    0.30 * synonym +
                    0.50 * llm_score
                )

                # -------- save result --------
                category_scores[tgt_cat][src_cat] = final_score
        return category_scores
    else:
        return None





if __name__ == '__main__':

    target_dict = {
        "user.name": "Alice",
        "user.email": "a@example.com",
        "user.age": 25,
        "order.id": 101,
        "orderamount": 500
    }

    source_dict = {
        "userName": "Bob",
        "userEmail": "b@example.com",
        "orderId": 202,
        "orderTotal": 800
    }
    result = CatogryScore(target_dict, source_dict)
    print("Category Scores:")
    for tgt, srcs in result.items():
        for src, score in srcs.items():
            print(f"{tgt} <- {src} : {score}")


