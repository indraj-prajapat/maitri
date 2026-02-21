from dotenv import load_dotenv
DESCRIPTION_MODEL = "moonshotai/kimi-k2-instruct"
import os 
# This resolves .env relative to config.py's location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Go up to the project root (adjust levels as needed)
load_dotenv(dotenv_path=os.path.join(BASE_DIR, '../../..', '.env'))

groq_api_key = os.getenv('groq_api_key')
# print('geoq api key',groq_api_key)
STOPWORDS = {
    "of", "the", "and", "in", "for", "if", "is", "nr", "mt",
    "y", "n", "yes", "a", "an", "on", "by", "to", "with"
}

CANON_MAP = {
    # numbers / identifiers
    "no": "NUMBER", "num": "NUMBER", "number": "NUMBER", "id": "NUMBER", "code": "NUMBER",
    # dates
    "dob": "DOB", "dateofbirth": "DOB", "birthdate": "DOB",
    "date": "DATE", "dt": "DATE", "datetime": "DATE",
    # container / vessel / gate
    "container": "CONTAINER", "cntr": "CONTAINER", "ctr": "CONTAINER",
    "vessel": "VESSEL", "ship": "VESSEL",
    "gate": "GATE",
    # commons
    "name": "NAME", "type": "TYPE"
}
GENERIC_CANON = {"NUMBER", "DATE", "TYPE", "NAME"}