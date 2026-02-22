
import os
import re
from pathlib import Path

from dotenv import load_dotenv
import json

from typing import Dict, Tuple, List

from typing import List, Dict
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import sys, os 
load_dotenv()

backend_dir = Path(__file__).resolve().parents[2]
asset_root_env = os.environ.get("BACKEND_ASSET_ROOT")
asset_root = Path(asset_root_env) if asset_root_env else backend_dir / "offline_assets"
if asset_root.exists():
    os.environ.setdefault("BACKEND_ASSET_ROOT", str(asset_root))
    os.environ.setdefault("HF_HOME", str(asset_root / "hf_home"))
    os.environ.setdefault("HUGGINGFACE_HUB_CACHE", str(asset_root / "hf_home" / "hub"))
    os.environ.setdefault("SENTENCE_TRANSFORMERS_HOME", str(asset_root / "sentence_transformers"))
    os.environ.setdefault("TORCH_HOME", str(asset_root / "torch_home"))
    os.environ.setdefault("XDG_CACHE_HOME", str(asset_root / "xdg_cache"))
    os.environ.setdefault("SPACY_DATA", str(asset_root / "spacy_data"))
    st_dir = asset_root / "sentence_transformers"
    hf_dir = asset_root / "hf_home"
    has_cached_assets = False
    if st_dir.exists():
        try:
            has_cached_assets = any(st_dir.iterdir())
        except Exception:
            has_cached_assets = False
    if not has_cached_assets and hf_dir.exists():
        try:
            has_cached_assets = any(hf_dir.iterdir())
        except Exception:
            has_cached_assets = False
    if has_cached_assets:
        os.environ.setdefault("HF_HUB_OFFLINE", "1")
        os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from src.config import *
api2 = groq_api_key
# Optional dependencies - graceful fallback
try:
    from Levenshtein import distance as levenshtein_distance
except Exception:
    # Fallback to simple Levenshtein (slower) if python-Levenshtein not installed
    def levenshtein_distance(a: str, b: str) -> int:
        if a == b:
            return 0
        if len(a) == 0:
            return len(b)
        if len(b) == 0:
            return len(a)
        prev_row = list(range(len(b) + 1))
        for i, ca in enumerate(a, 1):
            cur = [i]
            for j, cb in enumerate(b, 1):
                insertions = prev_row[j] + 1
                deletions = cur[j - 1] + 1
                substitutions = prev_row[j - 1] + (0 if ca == cb else 1)
                cur.append(min(insertions, deletions, substitutions))
            prev_row = cur
        return prev_row[-1]

# SentenceTransformer embeddings
try:
    from sentence_transformers import SentenceTransformer
    _ST_AVAILABLE = True
except Exception:
    _ST_AVAILABLE = False
    print("⚠️ sentence-transformers not available. Semantic scoring will be disabled.")

# Spacy for lemmatization
try:
    import spacy
    spacy_model = None
    try:
        spacy_model = spacy.load("en_core_web_md")
    except Exception:
        spacy_model = None
except Exception:
    spacy_model = None

# Groq client
try:
    import groq
except Exception:
    groq = None
    print("⚠️ groq package not installed. Install `groq-python` to enable LLM calls.")



def token_weight(tok_canon: str) -> float:
    return 0.6 if tok_canon in GENERIC_CANON else 1.6


def normalize(tok: str) -> str:
    t = tok.lower()
    t = re.sub(r"[^a-z0-9]", "", t)
    return CANON_MAP.get(t, t)

def semantic_cosine_score(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
    if vec_a is None or vec_b is None:
        return 0.0
    a = vec_a.reshape(1, -1)
    b = vec_b.reshape(1, -1)
    try:
        sim = cosine_similarity(a, b)[0][0]
        return float(max(0.0, min(1.0, sim)))
    except Exception:
        return 0.0
    

def levenshtein_similarity(a: str, b: str) -> float:
    a_proc = safe_preprocess_key(a)
    b_proc = safe_preprocess_key(b)
    if not a_proc or not b_proc:
        return 0.0
    dist = levenshtein_distance(a_proc, b_proc)
    max_len = max(len(a_proc), len(b_proc))
    if max_len == 0:
        return 1.0
    return max(0.0, 1.0 - (dist / max_len))


def safe_preprocess_key(key: str, preserve_structure=False) -> str:
    if not isinstance(key, str):
        key = str(key)
    s = key
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', s)
    s = re.sub(r'(?<=[A-Z])(?=[A-Z][a-z])', ' ', s)
    if not preserve_structure:
        s = s.lower()
        s = re.sub(r'[^a-z0-9\s]', ' ', s)
        s = re.sub(r'\s+', ' ', s).strip()
    else:
        s = s.lower().strip()
        s = re.sub(r'\s+', ' ', s)
    return s


def tokenize_key(key: str) -> List[str]:
    s = safe_preprocess_key(key)
    s = re.sub(r'\(.*?\)', '', s)
    tokens = re.findall(r'\b[a-z0-9]+\b', s)
    tokens = [lemmatize_token(t) for t in tokens if t and t not in STOPWORDS]
    return tokens

def lemmatize_token(token: str) -> str:
    """Lemmatize a single token using spaCy, with fallback to original token."""
    if spacy_model:
        doc = spacy_model(token)
        if doc:
            return doc[0].lemma_.lower()
    return token.lower()

def env_groq_client():
    if groq is None:
        raise RuntimeError("Groq library is not installed.")
    api_key = api2
    if not api_key.strip():
        raise ValueError("Groq API key is not provided.")
    return groq.Groq(api_key=api_key)

class GroqHelper:
    def __init__(self, client=None):
        self.client = client or (env_groq_client() if groq is not None else None)
        self.response_cache = {}


    def get_synonyms(self, key: str) -> List[str]:
        if key in self.response_cache:
            return self.response_cache[key]
        prompt = (
            f"You are an expert in maritime data. Provide a comma-separated list of "
            f"domain-specific synonyms and alternative labels for the term '{key}'. "
            f"For example, for 'GRT', synonyms might include 'Gross Tonnage', 'GrossRegTons'. "
            f"If none, return an empty string. Only return the list."
        )
        try:
            resp = self.client.chat.completions.create(
                model=DESCRIPTION_MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=64,
            )
            synonyms_str = resp.choices[0].message.content.strip()
            synonyms = [s.strip().lower() for s in synonyms_str.split(',') if s.strip()]
            # Limit to top-3 synonyms
            top_synonyms = synonyms[:3]
            # Add lemmatized versions of top-3
            lemmatized_synonyms = [lemmatize_token(s) for s in top_synonyms if lemmatize_token(s) != s]
            all_synonyms = top_synonyms + lemmatized_synonyms
            # Deduplicate
            all_synonyms = list(set(all_synonyms))
            self.response_cache[key] = all_synonyms
            return all_synonyms
        except Exception:
            return []

    def get_all_synonyms(self, keys: List[str]) -> Dict[str, set]:
        synonyms_cache = {}
        for key in keys:
            if key not in synonyms_cache:
                synonyms_cache[key] = set(self.get_synonyms(key))
        return synonyms_cache

class EmbeddingModel:
    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        if _ST_AVAILABLE:
            try:
                self.model = SentenceTransformer(model_name)
            except Exception as e:
                print(f"⚠️ Could not load SentenceTransformer ('{model_name}'): {e}")
                self.model = None

    def embed(self, texts: List[str]) -> List[np.ndarray]:
        if not self.model:
            return [np.zeros(384) for _ in texts]
        emb = self.model.encode(texts, show_progress_bar=False)
        if isinstance(emb, list):
            emb = np.array(emb)
        return emb

from groq import Groq
import os
import re
import json
from typing import Dict, Any, Tuple, Optional



client = Groq(api_key=groq_api_key)


def parse_json_response(response: str) -> Any:
    """
    Safely parse JSON from model response.
    Handles both code-fenced and plain JSON responses.
    """
    match = re.findall(r"```(?:json)?\s*(.*?)```", response, re.DOTALL)
    json_str = match[0] if match else response.strip()
    return json.loads(json_str)


def generate_description_format(fields_dict: Dict[str, Any]) -> Tuple[Optional[Dict[str, str]], Any]:
    """
    Use Groq (Llama 4) to generate one-line descriptions and formats for multiple fields in a single call.

    Args:
        fields_dict: A dictionary where each key is a field name and value is an example value.

    Returns:
        A tuple of (descriptions_dict, full_result_dict) or (None, error) on failure.
    """
    prompt = (
        "You are a data field and data integration expert. "
        "I will provide you with a dictionary where each key represents a data field name "
        "and the corresponding value is an example of what that field may contain.\n\n"

        "For each field, do the following:\n"
        "1. Write a very short one-line description of its meaning, based on the field name and example value, "
        "which will be used to match similar data fields.\n"
        "2. Identify the expected **format** of its value, which will be used for data transformation between "
        "different systems. Infer the format from the field name and example value.\n\n"

        "**Format Rules:**\n"
        "- If it looks like a number → specify 'integer', 'float', or add unit (e.g., 'weight in metric tons (float)').\n"
        "- If it looks like text → specify 'string', or 'string (alphanumeric)' if mixed.\n"
        "- If it looks like a date/time → specify exact format (e.g., 'DDMMYYYYHHmmss', 'DD/MM/YYYY HH:mm:ss', 'ISO 8601').\n"
        "- If ambiguous → provide the most reasonable generic format and note the ambiguity.\n"
        "- Be precise but concise, since the format will be used to transform values across systems.\n\n"

        "Note for generating descriptions:\n"
        "- For each field, provide a **concise one-line description** of its meaning.\n"
        "- Do NOT include phrases like 'alternative representation of', 'also known as', or any extra commentary.\n"
        "- Each description should **stand alone**, independent of other fields.\n"
        "- Keep it **neutral, factual, and short**, ideally under 5-7 words if possible.\n"
        "- Ensure the descriptions are suitable for **embedding-based similarity comparison**, i.e., no extra fluff.\n\n"

        "Return the output strictly as a JSON object where each key is the field name, "
        "and its value is an object with two fields: 'description' and 'format'.\n\n"

        "Example Output:\n"
        "{\n"
        "  \"containerNo\": {\n"
        "      \"description\": \"Unique identifier for a shipping container.\",\n"
        "      \"format\": \"string (alphanumeric)\"\n"
        "  },\n"
        "  \"gatePassDate\": {\n"
        "      \"description\": \"Date and time when a container passed through the gate.\",\n"
        "      \"format\": \"DD/MM/YYYY HH:mm:ss\"\n"
        "  }\n"
        "}\n\n"

        f"Dictionary: {json.dumps(fields_dict)}"
    )

    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a data transformation bot. Return only valid JSON matching the target dictionary "
                        "structure, enclosed in curly braces. Do not include any additional text or code blocks."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.0
        )

        response = completion.choices[0].message.content
        result = parse_json_response(response)

        descriptions = {}
        for key, values in result.items():
            descriptions[key] = values['description']

        # Fallback if model misses any key
        for key in fields_dict:
            if key not in descriptions:
                descriptions[key] = key

        return descriptions, result

    except Exception as err:
        return None, err


def transform_data(
    source_dict: Dict[str, Any],
    target_list: Dict[str, Any],
    data_mapping: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Use Groq (Llama 4) to transform a source dictionary into a target dictionary
    based on explicit field mappings and formatting rules.

    Args:
        source_dict: The source data dictionary.
        target_list: The target dictionary structure with expected keys.
        data_mapping: Mapping rules between source and target fields.

    Returns:
        Transformed target dictionary, or raises an exception on failure.
    """
    prompt = f"""
        You are a highly accurate data transformation engine. 
        Your task is to transform a source dictionary into a target dictionary 
        based on explicit mappings and formatting rules.

        ⚠️ Critical Requirements:
        - The output MUST be a valid JSON object.
        - Maintain the exact key order and key names given in the Target Dictionary Structure.
        - Do not include extra text, comments, or code blocks.
        - If a source key is missing, null, or transformation fails, set the value to null.

        ---

        ### Mappings
```json
        {json.dumps(data_mapping, indent=2)}
```

        ### Source Dict
```json
        {json.dumps(source_dict, indent=2)}
```

        ### Target Dict
```json
        {json.dumps(target_list, indent=2)}
```

        Transformation Rules

        1. For each target key:
            - Find its corresponding source key from the mappings.
            - Strictly map target key to source key from the data mapping. Do double verification. Don't use your own logic.
            - If mapping is null or missing → set value = null.

        2. Apply transformations according to source_format → target_format.
        Supported types and rules:
            - String (alphanumeric): copy as-is if valid; truncate/pad if required length is specified; else null.
            - Date/Time: convert from given source_format to target_format. Always return in the exact requested format. If conversion fails → null.
            - Integer: parse source as integer. If it contains extra symbols (e.g. "24500 KG"), strip non-digits if possible; else null.
            - Float: parse as float. Allow "kg", "mt", "M.T." suffixes by stripping units; else null.
            - Numeric String: pad with leading zeros or enforce exact length if specified.
            - Boolean / Enum (if present): map according to target_format description; else null.

        3. Validation before writing to output:
            - Ensure final value strictly matches the target_format.
            - Examples:
            - Date (YYYY-MM-DD HH:mm:ss): must match regex ^\\d{{4}}-\\d{{2}}-\\d{{2}} \\d{{2}}:\\d{{2}}:\\d{{2}}$.
            - Date (DDMMYYYYHHmmss): must match regex ^\\d{{14}}$.
            - String (alphanumeric, N chars): regex ^[A-Za-z0-9]{{N}}$.
            - String (alphanumeric, X-Y chars): regex ^[A-Za-z0-9]{{X,Y}}$.
            - Integer: must match regex ^-?\\d+$.
            - Float: must match regex ^-?\\d+(\\.\\d+)?$.

        4. Unit conversion:
            - If the source value contains a unit (e.g., hrs, kg, mt) and the target_format expects a different unit, convert the value appropriately.
            - Examples:
                - "2 hrs" → "120 mins" if target expects minutes.
                - "3.5 mt" → "3500 kg" if target expects kilograms.
            - Always include only the numeric value in the target unit (no extra text).
            - If unit conversion fails or is ambiguous, return null.

        5. Error handling:
            - If parsing/conversion/validation fails → set value = null.
            - Never guess or hallucinate values.

        Output:
        Return ONLY the transformed target dictionary as a valid JSON object, with keys in the exact order provided above.
    """

    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a data transformation bot. Return only valid JSON. "
                        "Do not include any additional text or code blocks."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.0
        )

        response = completion.choices[0].message.content
        result = parse_json_response(response)
        return result

    except Exception as err:
        raise RuntimeError(f"transform_data failed: {err}") from err
