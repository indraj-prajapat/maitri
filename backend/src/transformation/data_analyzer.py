import re
from datetime import datetime

class DataFieldAnalyzer:
    """
    Analyzes source and target data fields (key and value) to infer types, 
    determine transformation necessity, and perform transformation if required.
    """

    # Common keywords for field key analysis
    KEY_KEYWORDS = {
        "id": "identifier",
        "key": "identifier",
        "code": "identifier",
        "name": "name",
        "date": "date",
        "time": "time",
        "address": "location",
        "city": "location",
        "country": "location",
        "value": "numeric",
        "amount": "numeric",
        "price": "numeric",
        "qty": "numeric",
        "quantity": "numeric",
        "status": "category",
        "category": "category",
        "type": "category",
        "flag": "boolean",
    }

    # Common date formats to attempt parsing
    DATE_FORMATS = [
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%Y%m%d",
        "%d%m%Y",
    ]

    def __init__(self, row):
        """
        Initializes the analyzer with a row of data.
        :param row: A dictionary with keys: "sourceKey", "sourceValue", "targetKey", "targetValue".
        """
        self.src_key = row.get("sourceKey", "unknown")
        self.src_value = row.get("sourceValue")
        self.tgt_key = row.get("targetKey", "unknown")
        self.tgt_value = row.get("targetValue")
        
        # Ensure values are treated as strings for initial analysis
        self.src_value_str = str(self.src_value) if self.src_value is not None else ""
        self.tgt_value_str = str(self.tgt_value) if self.tgt_value is not None else ""

        self.src_key_tag = self._get_key_tag(self.src_key)
        self.tgt_key_tag = self._get_key_tag(self.tgt_key)

        self.src_value_tag, self.src_parsed_value, self.src_format = self._get_value_tag(self.src_value_str)
        self.tgt_value_tag, self.tgt_parsed_value, self.tgt_format = self._get_value_tag(self.tgt_value_str)

    def _get_key_tag(self, key_str):
        """Infers a tag from the field key string."""
        key_lower = key_str.lower()
        for keyword, tag in self.KEY_KEYWORDS.items():
            # Check if keyword is present anywhere in the key string
            if keyword in key_lower:
                return tag
        return "general"

    def _try_parse_date(self, value_str):
        """Tries to parse a string into a datetime object using common formats."""
        for fmt in self.DATE_FORMATS:
            try:
                # Attempt to parse with the specific format
                dt = datetime.strptime(value_str, fmt)
                # Determine if it's just a date or includes time
                if any(c in fmt for c in ['%H', '%M', '%S']):
                    return "datetime", dt, fmt
                else:
                    return "date", dt, fmt
            except ValueError:
                continue
        return None, None, None

    def _get_value_tag(self, value_str):
        """Infers the data type and format from the field value string."""
        if not value_str:
            return "null", None, None

        # 1. Try Numeric (Int/Float)
        try:
            # Try integer first
            int_val = int(value_str)
            return "integer", int_val, f"int_len:{len(value_str)}"
        except ValueError:
            try:
                # Try float
                float_val = float(value_str)
                # Format for float includes length of the string representation
                return "float", float_val, f"float_len:{len(value_str)}"
            except ValueError:
                pass

        # 2. Try Date/Time
        tag, parsed_value, fmt = self._try_parse_date(value_str)
        if tag:
            return tag, parsed_value, fmt

        # 3. String Analysis
        
        # Check for alphanumeric (potential code/ID)
        if re.search(r"\d", value_str) and re.search(r"[a-zA-Z]", value_str):
            # Contains both letters and numbers
            return "string_code", value_str, f"len:{len(value_str)}"

        # Check for all uppercase (potential category/code)
        if value_str.isupper() and value_str.isalpha():
            return "string_category_code", value_str, f"len:{len(value_str)}"

        # Check for spaces (potential name/address/phrase)
        if " " in value_str:
            return "string_phrase_address", value_str, f"len:{len(value_str)}"

        # Check for pure alphabetic (potential name/single word category)
        if value_str.isalpha():
            return "string_name_category", value_str, f"len:{len(value_str)}"

        # Check for pure numeric string (if not caught by int/float, e.g., very long ID)
        if value_str.isdigit():
            return "string_numeric_id", value_str, f"len:{len(value_str)}"

        # Default string
        return "string_plain", value_str, f"len:{len(value_str)}"

    def _get_length_from_format(self, fmt):
        """Extracts length from format strings like 'len:X', 'int_len:X', or 'float_len:X'."""
        match = re.search(r"len:(\d+)", fmt)
        return int(match.group(1)) if match else None

    def _determine_transformation_necessity(self):
        """Determines if a transformation is needed based on source and target analysis."""
        src_tag = self.src_value_tag
        tgt_tag = self.tgt_value_tag
        src_fmt = self.src_format
        tgt_fmt = self.tgt_format

        # 1. No transformation needed if tags and formats match (and not null)
        if src_tag == tgt_tag and src_fmt == tgt_fmt and src_tag != "null":
            return "none", "Tags and formats match."

        # 2. Type Mismatch (Fundamental)
        if src_tag != tgt_tag:
            # Special case: int/float are compatible
            if {src_tag, tgt_tag}.issubset({"integer", "float"}):
                return "numeric_cast", "Source and target are numeric but different types (int/float)."
            # Special case: date/datetime are compatible
            if {src_tag, tgt_tag}.issubset({"date", "datetime"}):
                # Fall through to date format check
                pass
            # Special case: string types are compatible for content/length check
            elif src_tag.startswith("string") and tgt_tag.startswith("string"):
                # Fall through to string format check
                pass
            # Special case: string to numeric (e.g., '123' to 123)
            elif src_tag.startswith("string") and tgt_tag in ["integer", "float"]:
                return "type_conversion_to_numeric", f"Type conversion needed: {src_tag} to {tgt_tag}."
            # Special case: numeric to string (e.g., 123 to '123')
            elif src_tag in ["integer", "float"] and tgt_tag.startswith("string"):
                return "type_conversion_to_string", f"Type conversion needed: {src_tag} to {tgt_tag}."
            # General type mismatch
            else:
                return "type_conversion_unsupported", f"Fundamental type mismatch: {src_tag} to {tgt_tag}."

        # 3. Same Type, Format Mismatch

        # Date/Time Format Mismatch
        if src_tag in ["date", "datetime"] and src_fmt != tgt_fmt:
            return "date_format", f"Date format mismatch: {src_fmt} to {tgt_fmt}."

        # Length Mismatch (for all types where length is captured in format)
        if "len:" in src_fmt and "len:" in tgt_fmt:
            src_len = self._get_length_from_format(src_fmt)
            tgt_len = self._get_length_from_format(tgt_fmt)
            
            if src_len is not None and tgt_len is not None and src_len != tgt_len:
                # Check if it's a string type that should be length-checked
                if src_tag in ["string_code", "string_numeric_id", "string_category_code", "string_plain"]:
                    return "string_length", f"String length mismatch: {src_len} to {tgt_len}."
                # Check if it's a numeric type that should be length-checked (e.g., ID)
                elif src_tag in ["integer", "float"] and self.src_key_tag == "identifier":
                    return "numeric_length", f"Numeric identifier length mismatch: {src_len} to {tgt_len}."

        # 4. Content difference (Category/Name/Address) - No structural transformation needed
        if src_tag in ["string_phrase_address", "string_name_category", "string_plain"]:
            # As per user request: "one side is "new delhi , india " and one side is "tokiyo , japan " then also dont need transformation"
            return "none", "Content difference (e.g., name, address, category value) - no structural transformation required."

        # 5. Fallback: Assume no transformation if not explicitly identified
        return "none", "No specific transformation identified."

    def _perform_transformation(self, transformation_type):
        """Performs the transformation based on the determined type."""
        
        if transformation_type == "none":
            return self.src_value_str

        # Date Format Transformation
        if transformation_type == "date_format":
            try:
                # Use the parsed datetime object and format it to the target format
                return self.src_parsed_value.strftime(self.tgt_format)
            except Exception:
                return f"ERROR: Failed to transform date from {self.src_format} to {self.tgt_format}"

        # String Length Transformation (Padding/Truncation)
        if transformation_type in ["string_length", "numeric_length"]:
            try:
                src_val = self.src_value_str
                tgt_len = self._get_length_from_format(self.tgt_format)
                
                if tgt_len is None:
                    return src_val # Cannot transform if target length is unknown

                if len(src_val) > tgt_len:
                    # Truncate
                    return src_val[:tgt_len]
                elif len(src_val) < tgt_len:
                    # Pad with '0' for numeric IDs, ' ' for others
                    is_numeric_id = self.src_value_tag in ["integer", "string_numeric_id"]
                    padding_char = '0' if is_numeric_id else ' '
                    return src_val.ljust(tgt_len, padding_char)
                else:
                    return src_val
            except Exception as e:
                return f"ERROR: Failed to transform length to {tgt_len}. Details: {e}"

        # Numeric Cast (e.g., float to int)
        if transformation_type == "numeric_cast":
            try:
                if self.tgt_value_tag == "integer":
                    # Cast to int (truncates decimal)
                    return str(int(self.src_parsed_value))
                elif self.tgt_value_tag == "float":
                    # Cast to float
                    return str(float(self.src_parsed_value))
                return self.src_value_str
            except Exception as e:
                return f"ERROR: Failed to cast numeric value to {self.tgt_value_tag}. Details: {e}"

        # Type Conversion (String to Numeric)
        if transformation_type == "type_conversion_to_numeric":
            try:
                if self.tgt_value_tag == "integer":
                    # Use float first to handle string like '19.99'
                    return str(int(float(self.src_value_str))) 
                elif self.tgt_value_tag == "float":
                    return str(float(self.src_value_str))
                return self.src_value_str
            except Exception as e:
                return f"ERROR: Failed to convert string to numeric type {self.tgt_value_tag}. Details: {e}"

        # Type Conversion (Numeric to String)
        if transformation_type == "type_conversion_to_string":
            # Simple string conversion
            return str(self.src_parsed_value)

        # Unsupported transformation
        return f"ERROR: Unsupported transformation type: {transformation_type}"


    def analyze_row(self):
        """
        Performs the full analysis and returns the structured result.
        """
        
        transformation_type, transformation_reason = self._determine_transformation_necessity()
        
        if transformation_type.startswith("ERROR") or transformation_type == "type_conversion_unsupported":
            transformation_needed = "Yes (Error/Unsupported)"
            transformed_value = self.src_value_str
        elif transformation_type == "none":
            transformation_needed = "No"
            transformed_value = self.src_value_str
        else:
            transformation_needed = "Yes"
            transformed_value = self._perform_transformation(transformation_type)

        return {
            "source_key": self.src_key,
            "source_key_tag": self.src_key_tag,
            "source_value": self.src_value_str,
            "source_value_tag": self.src_value_tag,
            "source_format": self.src_format,
            
            "target_key": self.tgt_key,
            "target_key_tag": self.tgt_key_tag,
            "target_value": self.tgt_value_str,
            "target_value_tag": self.tgt_value_tag,
            "target_format": self.tgt_format,
            
            "transformation_needed": transformation_needed,
            "transformation_type": transformation_type,
            "transformation_reason": transformation_reason,
            "transformed_value": transformed_value,
        }

# Example usage (for testing purposes)
if __name__ == '__main__':
    test_rows = [
        # 1. Date format transformation
        {
            "sourceKey": "Order_Date",
            "sourceValue": "2023-10-25", # %Y-%m-%d
            "targetKey": "ShipmentDate",
            "targetValue": "25/10/2023", # %d/%m/%Y
        },
        # 2. String length transformation (Truncation)
        {
            "sourceKey": "Product_ID",
            "sourceValue": "P-456-XYZ-001", # len:13
            "targetKey": "ItemCode",
            "targetValue": "P456XYZ001", # len:10
        },
        # 3. Numeric length transformation (Padding - ID)
        {
            "sourceKey": "Long_ID",
            "sourceValue": "12345", # len:5
            "targetKey": "Short_ID",
            "targetValue": "1234567890", # len:10
        },
        # 4. Numeric cast (Float to Int)
        {
            "sourceKey": "Price_USD",
            "sourceValue": "19.99", # float
            "targetKey": "Unit_Cost",
            "targetValue": "20", # integer
        },
        # 5. No transformation (Content difference)
        {
            "sourceKey": "Customer_Name",
            "sourceValue": "John Doe",
            "targetKey": "ClientName",
            "targetValue": "Jane Smith",
        },
        # 6. String length transformation (Truncation - Category)
        {
            "sourceKey": "STATUS_FLAG",
            "sourceValue": "ACTIVE",
            "targetKey": "Status",
            "targetValue": "A",
        },
        # 7. Type conversion (String to Float)
        {
            "sourceKey": "Raw_Value",
            "sourceValue": "123.45",
            "targetKey": "Final_Value",
            "targetValue": "123.45", # float
        },
        # 8. No transformation (Tags and formats match)
        {
            "sourceKey": "Test_Key",
            "sourceValue": "Test Value",
            "targetKey": "Test_Key",
            "targetValue": "Another Test Value",
        },
        # 9. Numeric length transformation (Truncation - ID)
        {
            "sourceKey": "ID_Source",
            "sourceValue": "1234567890123", # len:13
            "targetKey": "ID_Target",
            "targetValue": "1234567890", # len:10
        },
    ]

    print("--- Analysis Results ---")
    for i, row in enumerate(test_rows):
        analyzer = DataFieldAnalyzer(row)
        result = analyzer.analyze_row()
        print(f"\n--- Test Case {i+1} ---")
        print(f"Source Key: {row['sourceKey']} ({result['source_key_tag']}) -> Target Key: {row['targetKey']} ({result['target_key_tag']})")
        print(f"Source Value: '{row['sourceValue']}' ({result['source_value_tag']}, {result['source_format']})")
        print(f"Target Value: '{row['targetValue']}' ({result['target_value_tag']}, {result['target_format']})")
        print(f"Transformation Needed: {result['transformation_needed']}")
        print(f"Transformation Type: {result['transformation_type']}")
        print(f"Transformation Reason: {result['transformation_reason']}")
        print(f"Transformed Value: '{result['transformed_value']}'")
