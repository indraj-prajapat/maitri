import sys, os 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import openai
import json
from typing import List, Dict
from src.utils.helper import *

groq = GroqHelper(env_groq_client()) if groq is not None else None
emb = EmbeddingModel("all-MiniLM-L6-v2")

import numpy as np
from difflib import SequenceMatcher
from typing import Dict

import re

from collections import Counter

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


def match_any_category(categories, s):
    """
    Match a string against a list of categories.
    Returns [matched, category, remainder] where:
    - matched: True if a category was found
    - category: The matched category (longest valid match from the extracted category)
    - remainder: The part after the category
    """
    if not categories or not s:
        return [False, None, None]
    
    # Step 1: Extract the category from string s using same logic as find_categories
    delimiters = ['.', '/', '_', '-']
    n = len(s)
    last_delimiter_index = -1
    
    # Scan from right to left to find separators
    for i in range(n-1, 0, -1):
        # Check for explicit delimiters
        if s[i] in delimiters and last_delimiter_index == -1:
            last_delimiter_index = i
            break
    
    # If no valid split point found, string has no category
    if last_delimiter_index <= 0:
        return [False, None, None]
    
    # Extract the full category prefix from s
    extracted_category = s[:last_delimiter_index]
    remainder = s[last_delimiter_index:].lstrip("./_-")
    
    # Step 2: Find the longest matching category from the provided categories list
    # that matches the extracted category
    matched_category = None
    
    # Sort by length (longest first) to find the longest match
    sorted_categories = sorted(categories, key=lambda x: (-len(x), x))
    
    for category in sorted_categories:
        # Check if the extracted category matches this category exactly
        # or if the extracted category starts with this category
        if extracted_category == category:
            matched_category = category
            break
        elif extracted_category.startswith(category):
            # Verify it's a valid prefix (followed by delimiter)
            next_idx = len(category)
            if next_idx < len(extracted_category):
                next_char = extracted_category[next_idx]
                if next_char in './_-':
                    matched_category = category
                    break
    
    if matched_category:
        return [True, matched_category, remainder]
    
    return [False, None, None]
def category_penalty_score(s_tokens, t_tokens):
    """
    Returns a penalty multiplier in [0, 1]

    1.0 -> strong category match
    0.9 -> both unknown (other ↔ other)
    0.6 -> weakly compatible
    0.3 -> incompatible
    """

    CATEGORY_MAP = {
        "id": {
            "id", "identifier", "identification", "uuid", "guid",
            "number", "no", "num", "ref", "reference"
        },
        "name": {
            "name", "title", "label", "description", "desc"
        },
        "date": {
            "date", "time", "timestamp", "created", "updated",
            "modified", "dob", "eta", "etd"
        },
        "amount": {
            "amount", "price", "cost", "value", "total",
            "rate", "fee", "charge"
        },
        "count": {
            "count", "qty", "quantity", "numberof", "noof"
        },
        "status": {
            "status", "state", "flag", "active", "enabled"
        },
        "code": {
            "code", "type", "category", "class"
        }
    }

    def detect_categories(tokens):
        counts = {}
        for tok in tokens:
            for cat, keywords in CATEGORY_MAP.items():
                if tok in keywords:
                    counts[cat] = counts.get(cat, 0) + 1
        return counts  # category -> frequency

    s_counts = detect_categories(s_tokens)
    print('s_count',s_counts)

    t_counts = detect_categories(t_tokens)
    print('t_count',t_counts)

    # ---- both unknown → soft match, not perfect ----
    if not s_counts and not t_counts:
        return 0.9

    # ---- one known, one unknown → weak compatibility ----
    if not s_counts or not t_counts:
        return 0.6

    # dominant categories
    s_dom = max(s_counts, key=s_counts.get)
    t_dom = max(t_counts, key=t_counts.get)

    # exact dominant match
    if s_dom == t_dom:
        return 1.0

    # compatible dominant categories
    COMPATIBLE = {
        ("id", "code"),
        ("code", "id"),
        ("count", "amount"),
        ("amount", "count"),
        ("name", "code"),
    }

    if (s_dom, t_dom) in COMPATIBLE:
        return 0.6

    # strong mismatch
    return 0.4

def llm_descriptions_similarity(
    src_key: str, tgt_key: str, descriptions: Dict[str, str], emb_model
) -> float:
    """
    Compute similarity between LLM-generated descriptions for two keys.
    Uses both embeddings (semantic meaning) and string similarity
    to ensure high scores when context matches.
    """
    s_tokens = tokenize_key(src_key)
    t_tokens = tokenize_key(tgt_key)
    planty = category_penalty_score(s_tokens,t_tokens)
    print('LLM planty',planty)
    # Get descriptions (fallback to key if not found)
    src_desc = descriptions.get(src_key, src_key)
    tgt_desc = descriptions.get(tgt_key, tgt_key)

    # Enrich context by including key + description
    src_text = f"{src_key}: {src_desc}".lower().strip()
    tgt_text = f"{tgt_key}: {tgt_desc}".lower().strip()

    # ---- Embedding similarity ----
    vecs = emb_model.embed([src_text, tgt_text])
    v1, v2 = vecs[0], vecs[1]
    emb_score = float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2)))

    # ---- String similarity on text ----
    text_score = SequenceMatcher(None, src_text, tgt_text).ratio()

    # ---- Hybrid score ----
    # Weighted average: embeddings carry more weight, but string similarity boosts
    final_score = 0.7 * emb_score + 0.3 * text_score
    print('LLM Score',final_score)
    return final_score*planty


def compute_score(src_key, tgt_key, emb, groq):
    fuzzy, semantic, synonym = refined_token_disintegration_score(src_key, tgt_key, emb, groq)
    return tgt_key, fuzzy, semantic, synonym


def refined_token_disintegration_score(
    src_key: str,
    tgt_key: str,
    emb_model: EmbeddingModel,
    groq_helper: GroqHelper
) -> Tuple[float, float, float]:
    s_tokens = tokenize_key(src_key)
   
    
    t_tokens = tokenize_key(tgt_key)
 
    if not s_tokens or not t_tokens:
        return 0.0, 0.0, 0.0

    # --- your existing fuzzy + semantic parts (unchanged) ---
    all_tokens = list(set(s_tokens + t_tokens))
    token_embs = {tok: vec for tok, vec in zip(all_tokens, emb_model.embed(all_tokens))}

    def _score_one_way(tokens_a, tokens_b):
        GOOD_THRESHOLD = 0.6
        total_fuzzy_score = 0.0
        total_semantic_score = 0.0
        good_fuzzy_count = 0
        good_semantic_count = 0

        for tok_a in tokens_a:
            best_fuzzy = 0.0
            best_semantic = 0.0

            for tok_b in tokens_b:
                fuzzy_score = levenshtein_similarity(tok_a, tok_b)
                semantic_score = semantic_cosine_score(token_embs.get(tok_a), token_embs.get(tok_b))
                best_fuzzy = max(best_fuzzy, fuzzy_score)
                best_semantic = max(best_semantic, semantic_score)

            total_fuzzy_score += best_fuzzy
            total_semantic_score += best_semantic

            if best_fuzzy >= GOOD_THRESHOLD:
                good_fuzzy_count += 1
            if best_semantic >= GOOD_THRESHOLD:
                good_semantic_count += 1

        len_tokens_a = len(tokens_a)
        fuzzy_coverage = (good_fuzzy_count / len_tokens_a)*.8 + .2
        semantic_coverage = (good_semantic_count / len_tokens_a)*.8 + .2

        print('fuzzy pelanty', fuzzy_coverage)
        print('Simentic pelanty', semantic_coverage)

        fuzzy_result = (total_fuzzy_score / len_tokens_a) * fuzzy_coverage
        semantic_result = (total_semantic_score / len_tokens_a) * semantic_coverage

        return fuzzy_result, semantic_result

    fuzzy_src_to_tgt, semantic_src_to_tgt = _score_one_way(s_tokens, t_tokens)
    fuzzy_tgt_to_src, semantic_tgt_to_src = _score_one_way(t_tokens, s_tokens)

    def harmonic_mean(a, b):  # smoothed to avoid hard collapse
        return (2 * a * b) / (a + b + 1e-6)

    fuzzy_score = harmonic_mean(fuzzy_src_to_tgt, fuzzy_tgt_to_src)
    semantic_score = harmonic_mean(semantic_src_to_tgt, semantic_tgt_to_src)

    def one_side_synonym_score(src_tokens, tgt_tokens):
        # --- normalization ---
        s_norm = [normalize(t) for t in src_tokens]
        t_norm = [normalize(t) for t in tgt_tokens]

        s_set = set(s_norm)
        t_set = set(t_norm)

        # --- selective synonym expansion ---
        ABBREV_LIKE = {tok for tok in s_set if len(tok) <= 3 or tok in {"dob", "id", "no", "num"}}
        syn_expansion = (
            groq_helper.get_all_synonyms(list(ABBREV_LIKE))
            if ABBREV_LIKE else {}
        )

        def match_strength(tok_a: str, tok_b: str) -> float:
            if tok_a == tok_b:
                return 1.0
            if tok_b in syn_expansion.get(tok_a, set()):
                return 0.7
            if max(len(tok_a), len(tok_b)) <= 7 and levenshtein_similarity(tok_a, tok_b) >= 0.85:
                return 0.5
            return 0.0

        matched_weight = 0.0
        total_weight = sum(token_weight(t) for t in s_set)

        matched_tokens = 0

        for a in s_set:
            best = max(
                (match_strength(a, b) for b in t_set),
                default=0.0
            )
            if best > 0:
                matched_tokens += 1
                matched_weight += token_weight(a) * best

        score = (
            matched_weight / (total_weight + 1e-6)
            if total_weight > 0 else 0.0
        )

        # --- coverage adjustment ---
        coverage = matched_tokens / max(len(s_set), 1)
        score *= min(1.0, coverage + 0.2)

        # --- safety clamp ---
        return min(score, 0.85)

    forward = one_side_synonym_score(s_tokens, t_tokens)
    reverse = one_side_synonym_score(t_tokens, s_tokens)

    # asymmetric combination (forward dominates)
    synonym_score = forward * (0.7 + 0.3 * reverse)


    return fuzzy_score, semantic_score, synonym_score