from dotenv import load_dotenv
load_dotenv()
import json
from groq import Groq
from collections import OrderedDict
import os
groq_api_key = os.getenv('groq_api_key')
# Initialize Groq client
client = Groq(api_key= groq_api_key)

# Source dictionary
source_dict = {
    "rotationNo": "940965",
    "voyageNo": "2531E",
    "vesselName": "SAFEEN POWER",
    "vesselCallSign": "V7A5686",
    "containerNumber": "WHLU0246504",
    "loadPort": "AEJEA",
    "dischargePort": "INNSA",
    "destinationPort": "INNSA",
    "lineCode": "46862L",
    "terminalId": "T2",
    "isoCode": "2200",
    "containeCategory": "F",
    "containerCategoryStatus": "E",
    "listCode": "L",
    "containerMoveDate": "04/Aug/2025 5:07:00 PM",
    "containerWeight": "7.70",
    "vgmWeight": None,
    "sealNumber": "012190",
    "oogTop": None,
    "oogBottom": None,
    "oogRight": None,
    "oogLeft": None,
    "oogFront": None,
    "oogBack": None,
    "reeferTemperature": None,
    "reeferTemperatureUnit": None,
    "stowageLocation": "150504",
    "containerIMCO1": None,
    "containerUNNO1": None,
    "containerIMCO2": None,
    "containerUNNO2": None,
    "containerIMCO3": None,
    "containerUNNO3": None,
    "containerIMCO4": None,
    "containerUNNO4": None,
    "containerIMCO5": None,
    "containerUNNO5": None,
    "containerIMCO6": None,
    "containerUNNO6": None
}

# Target dictionary structure with null values
target_dict = OrderedDict([
    ("IMONumber", None),
    ("StuffDestuffFlag", None),
    ("ShippingAgentCode", None),
    ("TotNoContainer", None),
    ("LoadingPort", None),
    ("DestPort", None),
    ("FinalPortOfDischarge", None),
    ("ArrivalDateTime", None),
    ("EquipmentStatusCode", None),
    ("ReceiptDate", None),
    ("CargoType", None),
    ("ContainerNO", None),
    ("CACode", None),
    ("ConSealStatus", None),
    ("ContTypeClassificationCode", None),
    ("ContISOCode", None),
    ("DeliveryMode", None),
    ("GatePassNo", None),
    ("GatePassDateTime", None),
    ("VehicleNo", None),
    ("GateNumber", None),
    ("containerMoveDate", None)
])

# Load mappings from mappings.json
with open("mappings.json", "r", encoding="utf-8") as f:
    mappings = json.load(f)

# Construct the prompt with raw strings for regex
prompt = f"""
You are a data transformation expert. Your task is to transform a source dictionary into a target dictionary based on the provided mappings. The target dictionary must maintain the exact key order as specified and contain only the keys listed in the target structure. For each target key, apply the transformation rules from the mappings. If a source value is None, a mapping is null, or a transformation fails (e.g., format mismatch), set the target value to null. Ensure the output is valid JSON with the specified key order.

### Mappings
```json
{json.dumps(mappings, indent=2)}
```

### Source Dictionary
```json
{json.dumps(source_dict, indent=2)}
```

### Target Dictionary Structure (with null values)
```json
{json.dumps(dict(target_dict), indent=2)}
```

### Instructions
1. For each target key in the target dictionary structure, find the corresponding source key in the mappings.
2. If the mapping is null or the source key is missing, set the target value to null.
3. Apply the transformation from source_format to target_format as specified in the mappings:
   - For strings, copy or truncate/pad as needed (e.g., truncate to 3 characters for ShippingAgentCode).
   - For dates, convert between specified formats (e.g., 'DD/Mon/YYYY hh:mm:ss AM/PM' to 'DDMMYYYYHHmmss').
   - For integers, convert strings to integers; if conversion fails, return null.
   - For floats (e.g., weight in metric tons), copy or convert as specified; if invalid, return null.
   - For numeric strings, pad with leading zeros or adjust length as needed.
   - If the source value is None, return null.
4. Validate that the transformed value matches the target_format; if not, return null. Use these validation rules:
   - Date (DDMMYYYYHHmmss): Matches regex r'^\d{{12}}$'.
   - Weight in metric tons (float): Valid float with optional 'M.T.' suffix.
   - String (alphanumeric, X characters): Exact length X, alphanumeric characters (regex r'^[A-Za-z0-9]{{X}}$').
   - String (alphanumeric, X-Y characters): Length between X and Y, alphanumeric (regex r'^[A-Za-z0-9]{{X,Y}}$').
   - Integer: Valid integer.
5. Preserve the exact key order of the target dictionary structure.
6. Return only the transformed target dictionary as valid JSON, enclosed in curly braces {{}}. Do not include any additional text, explanations, or code blocks.

### Output
Return the transformed target dictionary in JSON format, maintaining the key order.
"""

# Send prompt to Groq API
response = client.chat.completions.create(
    model="meta-llama/llama-4-scout-17b-16e-instruct",  # More reliable for structured JSON output
    messages=[
        {"role": "system", "content": "You are a data transformation bot. Return only valid JSON matching the target dictionary structure, enclosed in curly braces. Do not include any additional text or code blocks."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.0,
    max_tokens=2000
)

# Parse the response
try:
    transformed_dict = json.loads(response.choices[0].message.content)
except json.JSONDecodeError as e:
    print(f"Error: Groq returned invalid JSON: {e}")
    transformed_dict = dict(target_dict)  # Fallback to null values

# Ensure all target keys are present, even if Groq omitted them
for key in target_dict:
    if key not in transformed_dict:
        transformed_dict[key] = None

# Convert to OrderedDict to preserve key order
ordered_transformed_dict = OrderedDict((key, transformed_dict.get(key, None)) for key in target_dict)

# Save transformed dictionary to JSON
output_path = "transformed_target_llm.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(ordered_transformed_dict, f, indent=4)

print(f"Transformed target dictionary saved to {output_path}")
print(json.dumps(dict(ordered_transformed_dict), indent=4))
