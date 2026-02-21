import re
from datetime import datetime
from src.transformation.unitParser import UnitParser
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
        "timestamp": "date",
        "created": "date",
        "updated": "date",
        "modified": "date",
        "address": "location",
        "city": "location",
        "country": "location",
        "value": "numeric",
        "amount": "numeric",
        "price": "numeric",
        "qty": "numeric",
        "quantity": "numeric",
        "count": "numeric",
        "total": "numeric",
        "weight": "numeric",
        "height": "numeric",
        "width": "numeric",
        "length": "numeric",
        "distance": "numeric",
        "volume": "numeric",
        "temperature": "numeric",
        "status": "category",
        "category": "category",
        "type": "category",
        "flag": "boolean",
        "active": "boolean",
        "enabled": "boolean",
    }
    # Expanded date formats with more variations
    Spc_Date = [
        # Compact formats WITHOUT separators (only if key suggests date)
        "%Y%m%d%H%M%S",
        "%Y%m%d%H%M",
        "%Y%m%d",
    ]
    DATE_FORMATS = [
        # -------------------------------------------------
        # ISO-8601 family
        # -------------------------------------------------
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%dT%H:%M",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S%z",
        "%y-%m-%d %H:%M:%S",
        "%y-%m-%d %H:%M",
        "%y-%m-%d",
        "%y-%m-%dT%H:%M:%S",
        "%y-%m-%dT%H:%M",
        "%y-%m-%dT%H:%M:%SZ",
        "%y-%m-%dT%H:%M:%S%z",

        # -------------------------------------------------
        # US numeric
        # -------------------------------------------------
        "%m/%d/%Y %H:%M:%S",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
        "%m-%d-%Y %H:%M:%S",
        "%m-%d-%Y %H:%M",
        "%m-%d-%Y",
        "%m.%d.%Y %H:%M:%S",
        "%m.%d.%Y %H:%M",
        "%m.%d.%Y",
        "%m/%d/%y %H:%M:%S",
        "%m/%d/%y %H:%M",
        "%m/%d/%y",
        "%m-%d-%y %H:%M:%S",
        "%m-%d-%y %H:%M",
        "%m-%d-%y",
        "%m.%d.%y %H:%M:%S",
        "%m.%d.%y %H:%M",
        "%m.%d.%y",

        # -------------------------------------------------
        # European numeric
        # -------------------------------------------------
        "%d/%m/%Y %H:%M:%S",
        "%d/%m/%Y %H:%M",
        "%d/%m/%Y",
        "%d-%m-%Y %H:%M:%S",
        "%d-%m-%Y %H:%M",
        "%d-%m-%Y",
        "%d.%m.%Y %H:%M:%S",
        "%d.%m.%Y %H:%M",
        "%d.%m.%Y",
        "%d/%m/%y %H:%M:%S",
        "%d/%m/%y %H:%M",
        "%d/%m/%y",
        "%d-%m-%y %H:%M:%S",
        "%d-%m-%y %H:%M",
        "%d-%m-%y",
        "%d.%m.%y %H:%M:%S",
        "%d.%m.%y %H:%M",
        "%d.%m.%y",

        # -------------------------------------------------
        # Compact date + colon-time (exactly as requested)
        # -------------------------------------------------
        "%Y%m%d:%H:%M:%S",
        "%Y%m%d:%H:%M",
        "%y%m%d:%H:%M:%S",
        "%y%m%d:%H:%M",
        "%d%m%Y:%H:%M:%S",
        "%d%m%Y:%H:%M",
        "%d%m%y:%H:%M:%S",
        "%d%m%y:%H:%M",

        # -------------------------------------------------
        # Month-name forms
        # -------------------------------------------------
        "%d %b %Y",
        "%d %B %Y",
        "%b %d, %Y",
        "%B %d, %Y",
        "%d %b %y",
        "%d %B %y",
        "%b %d, %y",
        "%B %d, %y",
        "%Y %b %d",
        "%Y %B %d",
        "%y %b %d",
        "%y %B %d",

        # with time
        "%d %b %Y %H:%M:%S",
        "%d %b %Y %H:%M",
        "%d %B %Y %H:%M:%S",
        "%d %B %Y %H:%M",
        "%b %d, %Y %H:%M:%S",
        "%b %d, %Y %H:%M",
        "%B %d, %Y %H:%M:%S",
        "%B %d, %Y %H:%M",
        "%d %b %y %H:%M:%S",
        "%d %b %y %H:%M",
        "%d %B %y %H:%M:%S",
        "%d %B %y %H:%M",
        "%b %d, %y %H:%M:%S",
        "%b %d, %y %H:%M",
        "%B %d, %y %H:%M:%S",
        "%B %d, %y %H:%M",

        # -------------------------------------------------
        # 12-hour clock AM/PM
        # -------------------------------------------------
        "%Y-%m-%d %I:%M:%S %p",
        "%Y-%m-%d %I:%M %p",
        "%y-%m-%d %I:%M:%S %p",
        "%y-%m-%d %I:%M %p",
        "%m/%d/%Y %I:%M:%S %p",
        "%m/%d/%Y %I:%M %p",
        "%m/%d/%y %I:%M:%S %p",
        "%m/%d/%y %I:%M %p",
        "%d/%m/%Y %I:%M:%S %p",
        "%d/%m/%Y %I:%M %p",
        "%d/%m/%y %I:%M:%S %p",
        "%d/%m/%y %I:%M %p",
        "%m-%d-%Y %I:%M:%S %p",
        "%m-%d-%Y %I:%M %p",
        "%m-%d-%y %I:%M:%S %p",
        "%m-%d-%y %I:%M %p",
        "%d-%m-%Y %I:%M:%S %p",
        "%d-%m-%Y %I:%M %p",
        "%d-%m-%y %I:%M:%S %p",
        "%d-%m-%y %I:%M %p",
        "%m.%d.%Y %I:%M:%S %p",
        "%m.%d.%Y %I:%M %p",
        "%m.%d.%y %I:%M:%S %p",
        "%m.%d.%y %I:%M %p",
        "%d.%m.%Y %I:%M:%S %p",
        "%d.%m.%Y %I:%M %p",
        "%d.%m.%y %I:%M:%S %p",
        "%d.%m.%y %I:%M %p",

        # month-name + 12-hour
        "%d %b %Y %I:%M:%S %p",
        "%d %b %Y %I:%M %p",
        "%d %B %Y %I:%M:%S %p",
        "%d %B %Y %I:%M %p",
        "%b %d, %Y %I:%M:%S %p",
        "%b %d, %Y %I:%M %p",
        "%B %d, %Y %I:%M:%S %p",
        "%B %d, %Y %I:%M %p",
        "%d %b %y %I:%M:%S %p",
        "%d %b %y %I:%M %p",
        "%d %B %y %I:%M:%S %p",
        "%d %B %y %I:%M %p",
        "%b %d, %y %I:%M:%S %p",
        "%b %d, %y %I:%M %p",
        "%B %d, %y %I:%M:%S %p",
        "%B %d, %y %I:%M %p",
    ]
    
    
    # Ambiguous date formats that should only be tried if key suggests date/time
    AMBIGUOUS_DATE_FORMATS = [
        "%Y%m%d%H%M%S",
        "%Y%m%d%H%M",
        "%Y%m%d",
        "%d%m%Y",  # Could be confused with numeric ID
        "%d%m%y",  # Could be confused with numeric ID
        "%m%d%Y",
        "%m%d%y",
        "%d%m%y:%H:%M:%S",
        "%d%m%y:%H:%M",
    ]

    def __init__(self, row):
        """
        Initializes the analyzer with a row of data.
        :param row: A dictionary with keys: "sourceKey", "sourceValue", "targetKey", "targetValue".
        """
        # Initialize unit parser
        self.unit_parser = UnitParser()  # ← ADD THIS LINE
        
        self.src_key = row.get("sourceKey", "unknown")
        self.src_value = row.get("sourceValue")
        self.tgt_key = row.get("targetKey", "unknown")
        self.tgt_value = row.get("targetValue")
        
        # Ensure values are treated as strings for initial analysis
        self.src_value_str = str(self.src_value) if self.src_value is not None else ""
        self.tgt_value_str = str(self.tgt_value) if self.tgt_value is not None else ""

        self.src_key_tag = self._get_key_tag(self.src_key)
        self.tgt_key_tag = self._get_key_tag(self.tgt_key)

        # Parse for units FIRST, before type analysis  ← ADD THESE 2 LINES
        self.src_unit_info = self.unit_parser.parse(self.src_value_str)
        self.tgt_unit_info = self.unit_parser.parse(self.tgt_value_str)

        # Update these lines to pass unit_info  ← MODIFY THESE 2 LINES
        self.src_value_tag, self.src_parsed_value, self.src_format = self._get_value_tag(
            self.src_value_str, self.src_key_tag, self.src_unit_info
        )
        self.tgt_value_tag, self.tgt_parsed_value, self.tgt_format = self._get_value_tag(
            self.tgt_value_str, self.tgt_key_tag, self.tgt_unit_info
        )
    def _get_key_tag(self, key_str):
        """Infers a tag from the field key string."""
        key_lower = key_str.lower()
        for keyword, tag in self.KEY_KEYWORDS.items():
            if keyword in key_lower:
                return tag
        return "general"

    def _normalize_date_string(self, value_str):
        """
        Normalizes date string by handling common variations.
        Returns normalized string and any preprocessing info.
        """
        normalized = value_str.strip()
        
        # Remove common timezone indicators that might interfere
        normalized = re.sub(r'\s*UTC\s*$', '', normalized, flags=re.IGNORECASE)
        normalized = re.sub(r'\s*GMT\s*$', '', normalized, flags=re.IGNORECASE)
        
        return normalized

    def _try_parse_unix_timestamp(self, value_str):
        """Attempts to parse a Unix timestamp (seconds or milliseconds)."""
        try:
            # Check if it's a pure numeric string
            if not value_str.replace('.', '').isdigit():
                return None, None, None
            
            timestamp = float(value_str)
            
            # Unix timestamps in seconds (10 digits) or milliseconds (13 digits)
            if 1000000000 <= timestamp < 10000000000:  # Seconds
                dt = datetime.fromtimestamp(timestamp)
                return "datetime", dt, "unix_timestamp_sec"
            elif 1000000000000 <= timestamp < 10000000000000:  # Milliseconds
                dt = datetime.fromtimestamp(timestamp / 1000)
                return "datetime", dt, "unix_timestamp_ms"
            
            # Determine which formats to try based on context
            formats_to_try = self.Spc_Date.copy()
            
            # Only add ambiguous formats if key suggests date/time
        
            
            # Try all applicable date formats
            for fmt in formats_to_try:
                try:
                    dt = datetime.strptime(value_str, fmt)
                    
                    
                    # Determine if it includes time components
                    has_time = any(c in fmt for c in ['%H', '%I', '%M', '%S'])
                    
                    if has_time:
                        return "datetime", dt, fmt
                    else:
                        return "date", dt, fmt
                except ValueError:
                    continue
        except (ValueError, OSError, OverflowError):
            pass
        
        return None, None, None

    def _is_likely_date_context(self, key_tag):
        """Determines if the key context suggests this should be interpreted as a date."""
        return key_tag in ["date", "time"]

    def _try_parse_date(self, value_str, key_tag):
        """
        Tries to parse a string into a datetime object using common formats.
        Uses key_tag to determine if ambiguous formats should be attempted.
        """
        if not value_str:
            return None, None, None
        
        # Normalize the input
        normalized = self._normalize_date_string(value_str)
        
        # Try Unix timestamp first (only if key suggests date/time OR value is clearly a timestamp)
        if self._is_likely_date_context(key_tag) :
            tag, parsed, fmt = self._try_parse_unix_timestamp(normalized)
            if tag:
                return tag, parsed, fmt
        
        # Determine which formats to try based on context
        formats_to_try = self.DATE_FORMATS.copy()
        
        # Only add ambiguous formats if key suggests date/time
      
        
        # Try all applicable date formats
        for fmt in formats_to_try:
            try:
                dt = datetime.strptime(normalized, fmt)
                
                
                # Determine if it includes time components
                has_time = any(c in fmt for c in ['%H', '%I', '%M', '%S'])
                
                if has_time:
                    return "datetime", dt, fmt
                else:
                    return "date", dt, fmt
            except ValueError:
                continue
        
        # Special handling for partial date patterns (only if key suggests date)
        if self._is_likely_date_context(key_tag):
            # Example: "2023-10" (year-month only)
            if re.match(r'^\d{4}-\d{2}$', normalized):
                try:
                    dt = datetime.strptime(normalized + "-01", "%Y-%m-%d")
                    return "date", dt, "%Y-%m (partial)"
                except ValueError:
                    pass
       
        return None, None, None

    def _is_boolean_value(self, value_str):
        """Checks if value is a boolean representation."""
        bool_values = {
            'true', 'false', 'yes', 'no', 'y', 'n', 
            '1', '0', 't', 'f', 'on', 'off'
        }
        return value_str.lower() in bool_values
    
    def _get_unit_from_format(self, fmt):
        """Extract unit from format string."""
        if not fmt:
            return None
        match = re.search(r"unit:([^|]+)", fmt)
        return match.group(1).strip() if match else None
    
    def _get_value_tag(self, value_str, key_tag, unit_info):
        """
        Infers the data type and format from the field value string.
        Uses key_tag as context to disambiguate between similar patterns.
        """
        # Check null FIRST
        if not value_str or value_str.lower() in ['none', 'null', 'nan', '']:
            return "null", None, None

        # PRIORITY 1: Check if value has a unit attached
        if unit_info and unit_info.get('has_unit', False):
            # This is a numeric value with a unit
            numeric_val = unit_info['numeric_value']
            unit = unit_info['unit']
            unit_category = unit_info['unit_category']
            
            # Determine if it's integer or float
            try:
                if '.' in str(numeric_val):
                    parsed_val = float(numeric_val)
                    return "numeric_with_unit", parsed_val, f"unit:{unit}|category:{unit_category}"
                else:
                    parsed_val = int(numeric_val)
                    return "numeric_with_unit", parsed_val, f"unit:{unit}|category:{unit_category}"
            except (ValueError, TypeError):
                # Fallback if numeric parsing fails
                return "string_with_unit", value_str, f"unit:{unit}|category:{unit_category}"

        # PRIORITY 2: Try Boolean (if key suggests boolean OR value is clearly boolean)
        if key_tag == "boolean" and self._is_boolean_value(value_str):
            return "boolean", value_str.lower() in ['true', 'yes', 'y', '1', 't', 'on'], "boolean"

        # PRIORITY 3: Try Date/Time (ONLY if key suggests date, OR value has clear date separators)
        should_try_date = (
            self._is_likely_date_context(key_tag) or 
            bool(re.search(r'[-/:\s]', value_str)) or  # Has date separators
            len(value_str) >= 10  # Long enough to be a timestamp
        )
        
        if should_try_date:
            tag, parsed_value, fmt = self._try_parse_date(value_str, key_tag)
            if tag:
                return tag, parsed_value, fmt

        # PRIORITY 4: Try Numeric (Int/Float)
        # Prioritize numeric interpretation for identifier keys
        if key_tag == "identifier" or key_tag == "numeric":
            # Check for pure integer (including negative)
            if re.match(r'^-?\d+$', value_str):
                int_val = int(value_str)
                return "integer", int_val, f"int_len:{len(value_str)}"
            
            # Check for float
            if re.match(r'^-?\d+\.\d+$', value_str):
                float_val = float(value_str)
                return "float", float_val, f"float_len:{len(value_str)}"
        
        # General numeric check (for non-identifier fields)
        if re.match(r'^-?\d+$', value_str):
            int_val = int(value_str)
            return "integer", int_val, f"int_len:{len(value_str)}"
        
        if re.match(r'^-?\d+\.\d+$', value_str):
            float_val = float(value_str)
            return "float", float_val, f"float_len:{len(value_str)}"
        
        # Scientific notation
        if re.match(r'^-?\d+\.?\d*[eE][+-]?\d+$', value_str):
            try:
                float_val = float(value_str)
                return "float", float_val, "scientific_notation"
            except ValueError:
                pass

        # PRIORITY 5: String Analysis with improved pattern matching
        
        # Email pattern
        if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', value_str):
            return "string_email", value_str, f"len:{len(value_str)}"
        
        # URL pattern
        if re.match(r'^https?://', value_str, re.IGNORECASE):
            return "string_url", value_str, f"len:{len(value_str)}"
        
        # Phone number pattern (various formats)
        if re.match(r'^[\d\s\-\(\)\+\.]{10,}$', value_str) and re.search(r'\d{3,}', value_str):
            return "string_phone", value_str, f"len:{len(value_str)}"
        
        # Alphanumeric code (mix of letters and numbers)
        if re.search(r"\d", value_str) and re.search(r"[a-zA-Z]", value_str):
            # Check if it's UUID-like
            if re.match(r'^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$', value_str, re.IGNORECASE):
                return "string_uuid", value_str, f"len:{len(value_str)}"
            return "string_code", value_str, f"len:{len(value_str)}"

        # All uppercase alphabetic (category/status code)
        if value_str.isupper() and value_str.isalpha():
            return "string_category_code", value_str, f"len:{len(value_str)}"

        # Contains spaces (phrase, name, or address)
        if " " in value_str:
            # Distinguish between address (contains numbers) and phrase
            if re.search(r'\d', value_str):
                return "string_address", value_str, f"len:{len(value_str)}"
            return "string_phrase", value_str, f"len:{len(value_str)}"

        # Pure alphabetic (name or single-word category)
        if value_str.isalpha():
            return "string_name_category", value_str, f"len:{len(value_str)}"

        # Pure numeric string (very long ID not parsed as int)
        if value_str.isdigit():
            return "string_numeric_id", value_str, f"len:{len(value_str)}"

        # Default string
        return "string_plain", value_str, f"len:{len(value_str)}"
    def _get_length_from_format(self, fmt):
        """Extracts length from format strings like 'len:X', 'int_len:X', or 'float_len:X'."""
        if not fmt:
            return None
        match = re.search(r"len:(\d+)", fmt)
        return int(match.group(1)) if match else None

    def _determine_transformation_necessity(self):
        """Determines if a transformation is needed based on source and target analysis."""
        src_tag = self.src_value_tag
        tgt_tag = self.tgt_value_tag
        src_fmt = self.src_format
        tgt_fmt = self.tgt_format

        # 1. Null handling
        if src_tag == "null" or tgt_tag == "null":
            if src_tag == tgt_tag:
                return "none", "Both values are null."
            return "null_handling", f"Null value encountered: {src_tag} to {tgt_tag}."

        # 2. Exact match (no transformation needed)
        if src_tag == tgt_tag and src_fmt == tgt_fmt:
            return "none", "Tags and formats match exactly."
        # 2. Exact match (no transformation needed)
        if src_tag == tgt_tag and src_fmt == tgt_fmt:
            return "none", "Tags and formats match exactly."

        # 3. UNIT HANDLING
        # Both have numeric_with_unit
        if src_tag == "numeric_with_unit" and tgt_tag == "numeric_with_unit":
            src_unit = self._get_unit_from_format(src_fmt)
            tgt_unit = self._get_unit_from_format(tgt_fmt)
            
            if src_unit == tgt_unit:
                return "none", f"Both have same unit: {src_unit}."
            else:
                return "unit_conversion", f"Unit conversion needed: {src_unit} to {tgt_unit}."

        # One has unit, other doesn't
        if src_tag == "numeric_with_unit" and tgt_tag in ["integer", "float"]:
            return "strip_unit", "Remove unit from source value."

        if src_tag in ["integer", "float"] and tgt_tag == "numeric_with_unit":
            tgt_unit = self._get_unit_from_format(tgt_fmt)
            return "add_unit", f"Add unit to source value: {tgt_unit}."

        # 4. Type compatibility checks

       
        
        # ---------- numeric types ----------
        if {src_tag, tgt_tag}.issubset({"integer", "float"}):
            # 1.  int ↔ float  →  cast
            if src_tag != tgt_tag:
                return "numeric_cast", f"Numeric type conversion: {src_tag} to {tgt_tag}."

            # 2.  float → float  →  DECIMAL-PLACES check only
            if src_tag == "float":
                # helper: count digits after the dot
                def _scale(fmt):
                    if not fmt or "decimal:" not in str(fmt):
                        return 0
                    # fmt is expected to contain "decimal:n"
                    return int(str(fmt).split("decimal:")[1].split()[0])

                src_scale = _scale(src_fmt)
                tgt_scale = _scale(tgt_fmt)
                if src_scale != tgt_scale:
                    return "numeric_precision", f"Float precision change: {src_scale} → {tgt_scale} decimals."
                return "none", "Same float precision – no conversion needed."

            # 3.  int → int  →  never a change
            return "none", "Same integer type – no conversion needed."

        # Date/DateTime types
        if {src_tag, tgt_tag}.issubset({"date", "datetime"}):
            if src_fmt != tgt_fmt:
                return "date_format", f"Date format conversion: {src_fmt} to {tgt_fmt}."
            return "none", "Date formats match."

        # Boolean types
        if src_tag == "boolean" and tgt_tag == "boolean":
            return "none", "Boolean values (format may vary but type is same)."

        # String type variations
        string_types = {
            "string_code", "string_numeric_id", "string_category_code",
            "string_phrase", "string_address", "string_name_category",
            "string_plain", "string_email", "string_url", "string_phone",
            "string_uuid", "string_with_unit"
        }
        
        if src_tag in string_types and tgt_tag in string_types:
            # Check for length mismatch
            if "len:" in str(src_fmt) and "len:" in str(tgt_fmt):
                src_len = self._get_length_from_format(src_fmt)
                tgt_len = self._get_length_from_format(tgt_fmt)
                
                if src_len and tgt_len and src_len != tgt_len:
                    # Only flag as transformation needed for certain types
                    if src_tag in ["string_code", "string_numeric_id", "string_category_code"]:
                        return "string_length", f"String length adjustment: {src_len} to {tgt_len}."
            
            # Content difference (e.g., different names, addresses)
            return "none", "String content difference - no structural transformation required."

        # 4. Cross-type conversions
        
        # String to Numeric
        if src_tag in string_types and tgt_tag in ["integer", "float"]:
            return "type_conversion_to_numeric", f"Convert string to {tgt_tag}."
        
        # Numeric to String
        if src_tag in ["integer", "float"] and tgt_tag in string_types:
            return "type_conversion_to_string", f"Convert {src_tag} to string."
        
        # String to Date/DateTime
        if src_tag in string_types and tgt_tag in ["date", "datetime"]:
            return "type_conversion_to_date", f"Convert string to {tgt_tag}."
        
        # Date/DateTime to String
        if src_tag in ["date", "datetime"] and tgt_tag in string_types:
            return "type_conversion_to_string", f"Convert {src_tag} to string."
        
        # Boolean conversions
        if src_tag == "boolean" and tgt_tag in string_types:
            return "type_conversion_to_string", "Convert boolean to string."
        
        if src_tag in string_types and tgt_tag == "boolean":
            return "type_conversion_to_boolean", "Convert string to boolean."

        # 5. Unsupported conversions
        return "type_conversion_unsupported", f"Unsupported conversion: {src_tag} to {tgt_tag}."

    def _perform_transformation(self, transformation_type):
        """Performs the transformation based on the determined type."""
        
        if transformation_type == "none":
            return self.src_value_str
        # Unit transformations
        if transformation_type == "strip_unit":
            if self.src_unit_info and self.src_unit_info.get('has_unit', False):
                return self.src_unit_info['numeric_value']
            return self.src_value_str
        
        if transformation_type == "add_unit":
            tgt_unit = self._get_unit_from_format(self.tgt_format)
            if tgt_unit:
                return f"{self.src_value_str} {tgt_unit}"
            return self.src_value_str
        
        if transformation_type == "unit_conversion":
            # Return indication that unit conversion is needed
            src_unit = self._get_unit_from_format(self.src_format)
            tgt_unit = self._get_unit_from_format(self.tgt_format)
            return f"{self.src_unit_info['numeric_value']} {tgt_unit} (converted from {src_unit})"

        # Date Format Transformation
        if transformation_type == "date_format":
            try:
                if self.src_parsed_value:
                    # Handle special format cases
                    if "unix_timestamp" in str(self.tgt_format):
                        # Convert to Unix timestamp
                        if "ms" in self.tgt_format:
                            return str(int(self.src_parsed_value.timestamp() * 1000))
                        return str(int(self.src_parsed_value.timestamp()))
                    
                    # Standard datetime formatting
                    return self.src_parsed_value.strftime(self.tgt_format)
                return f"ERROR: No parsed datetime available"
            except Exception as e:
                return f"ERROR: Date transformation failed - {str(e)}"

        # Numeric Length Transformation
        if transformation_type == "numeric_length":
            try:
                src_val = self.src_value_str
                tgt_len = self._get_length_from_format(self.tgt_format)
                
                if tgt_len is None:
                    return src_val

                if len(src_val) > tgt_len:
                    # Truncate from left for numeric values
                    return src_val[-tgt_len:]
                elif len(src_val) < tgt_len:
                    # Left pad with zeros for numeric values
                    return src_val.zfill(tgt_len)
                return src_val
            except Exception as e:
                return f"ERROR: Numeric length transformation failed - {str(e)}"

        # String Length Transformation
        if transformation_type == "string_length":
            try:
                src_val = self.src_value_str
                tgt_len = self._get_length_from_format(self.tgt_format)
                
                if tgt_len is None:
                    return src_val

                if len(src_val) > tgt_len:
                    # Truncate
                    return src_val[:tgt_len]
                elif len(src_val) < tgt_len:
                    # Pad appropriately
                    is_numeric = self.src_value_tag in ["string_numeric_id"]
                    pad_char = '0' if is_numeric else ' '
                    # Left pad for numeric IDs, right pad for others
                    if is_numeric:
                        return src_val.zfill(tgt_len)
                    return src_val.ljust(tgt_len, pad_char)
                return src_val
            except Exception as e:
                return f"ERROR: Length transformation failed - {str(e)}"

        # Numeric Cast
        if transformation_type == "numeric_cast":
            try:
                if self.tgt_value_tag == "integer":
                    return str(int(self.src_parsed_value))
                elif self.tgt_value_tag == "float":
                    return str(float(self.src_parsed_value))
                return self.src_value_str
            except Exception as e:
                return f"ERROR: Numeric cast failed - {str(e)}"

        # Type Conversion: String to Numeric
        if transformation_type == "type_conversion_to_numeric":
            try:
                # If source has unit, use the numeric part
                if self.src_unit_info and self.src_unit_info.get('has_unit', False):
                    cleaned = self.src_unit_info['numeric_value']
                else:
                    # Remove common formatting characters
                    cleaned = re.sub(r'[,\s$€£¥]', '', self.src_value_str)
                
                if self.tgt_value_tag == "integer":
                    return str(int(float(cleaned)))
                elif self.tgt_value_tag == "float":
                    return str(float(cleaned))
                return self.src_value_str
            except Exception as e:
                return f"ERROR: String to numeric conversion failed - {str(e)}"

        # Type Conversion: Numeric to String
        if transformation_type == "type_conversion_to_string":
            try:
                if self.src_value_tag in ["date", "datetime"] and self.src_parsed_value:
                    # Use ISO format as default
                    return self.src_parsed_value.strftime("%Y-%m-%d %H:%M:%S")
                if self.src_value_tag == "numeric_with_unit":
                    # Keep the unit when converting to string
                    return self.src_value_str
                return str(self.src_parsed_value if self.src_parsed_value is not None else self.src_value_str)
            except Exception as e:
                return f"ERROR: To string conversion failed - {str(e)}"

        # Type Conversion: String to Date
        if transformation_type == "type_conversion_to_date":
            try:
                _, parsed, _ = self._try_parse_date(self.src_value_str, self.src_key_tag)
                if parsed:
                    if self.tgt_format:
                        return parsed.strftime(self.tgt_format)
                    return parsed.strftime("%Y-%m-%d %H:%M:%S")
                return f"ERROR: Could not parse date from string"
            except Exception as e:
                return f"ERROR: String to date conversion failed - {str(e)}"

        # Type Conversion: String to Boolean
        if transformation_type == "type_conversion_to_boolean":
            try:
                true_values = {'true', 'yes', 'y', '1', 't', 'on'}
                return str(self.src_value_str.lower() in true_values)
            except Exception as e:
                return f"ERROR: String to boolean conversion failed - {str(e)}"

        # Null Handling
        if transformation_type == "null_handling":
            return ""

        # Unsupported
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


# Comprehensive test cases
if __name__ == '__main__':
    test_rows = [
    # 1. Date with mixed separators + timezone
    {
        "sourceKey": "created_at",
        "sourceValue": "2023/10-25T14:30:00+05:30",
        "targetKey": "created_date",
        "targetValue": "2023-10-25",
    },

    # 2. U.S. vs EU format ambiguity
    {
        "sourceKey": "order_date",
        "sourceValue": "03/04/2023",   # Is it 3 April or 4 March?
        "targetKey": "processed_date",
        "targetValue": "2023-04-03",
    },

    # 3. Date written in words
    {
        "sourceKey": "invoice_date",
        "sourceValue": "25th October 2023",
        "targetKey": "date",
        "targetValue": "2023-10-25",
    },

    # 4. Weird compact datetime without timezone
    {
        "sourceKey": "updated",
        "sourceValue": "20231025123045",
        "targetKey": "update_date",
        "targetValue": "2023-10-25",
    },

    # 5. Numeric that looks like date but is ID
    {
        "sourceKey": "tracking_number",
        "sourceValue": "202312",
        "targetKey": "tracking_code",
        "targetValue": "000202312",
    },

    # 6. Decimal with comma (EU format)
    {
        "sourceKey": "price",
        "sourceValue": "1.234,56",
        "targetKey": "amount",
        "targetValue": "1234.56",
    },

    # 7. Scientific notation number
    {
        "sourceKey": "distance_km",
        "sourceValue": "1.2e3",
        "targetKey": "distance_m",
        "targetValue": "1200000",  # 1.2e3 km → meters
    },

    # 8. Boolean in weird format
    {
        "sourceKey": "enabled",
        "sourceValue": "Y",
        "targetKey": "flag",
        "targetValue": "true",
    },

    # 9. Unicode numbers
    {
        "sourceKey": "count",
        "sourceValue": "٢٠٢٣",   # Arabic digits for 2023
        "targetKey": "value",
        "targetValue": "2023",
    },

    # 10. Text with hidden Unicode spaces
    {
        "sourceKey": "username",
        "sourceValue": "john\u200bdoe",   # zero-width space
        "targetKey": "clean_username",
        "targetValue": "johndoe",
    },

    # 11. Currency with symbols + commas
    {
        "sourceKey": "price_usd",
        "sourceValue": "$2,500.00",
        "targetKey": "amount",
        "targetValue": "2500",
    },

    # 12. Currency with symbol at end
    {
        "sourceKey": "salary",
        "sourceValue": "3500₹",
        "targetKey": "amount",
        "targetValue": "3500",
    },

    # 13. Measurement with different units
    {
        "sourceKey": "height",
        "sourceValue": "5 ft",
        "targetKey": "height_cm",
        "targetValue": "152.4",
    },

    # 14. Mixed units + extra text
    {
        "sourceKey": "weight",
        "sourceValue": "approx. 2.5 kg (net)",
        "targetKey": "mass_g",
        "targetValue": "2500",
    },

    # 15. Leading and trailing spaces + tabs
    {
        "sourceKey": "item_code",
        "sourceValue": "   AB-123\t ",
        "targetKey": "code",
        "targetValue": "AB-123",
    },

    # 16. Null-like string
    {
        "sourceKey": "middle_name",
        "sourceValue": "NULL",
        "targetKey": "mname",
        "targetValue": "",
    },

    # 17. JSON string inside value
    {
        "sourceKey": "meta",
        "sourceValue": "{\"a\":1, \"b\":2}",
        "targetKey": "meta_b",
        "targetValue": "2",
    },

    # 18. Date with weekday name
    {
        "sourceKey": "event_date",
        "sourceValue": "Wed, 25 Oct 2023",
        "targetKey": "date",
        "targetValue": "2023-10-25",
    },

    # 19. Temperature conversion
    {
        "sourceKey": "temp_c",
        "sourceValue": "100C",
        "targetKey": "temp_f",
        "targetValue": "212F",
    },

    # 20. Mixed alphanumeric + extraction
    {
        "sourceKey": "product",
        "sourceValue": "Item#2345A",
        "targetKey": "product_id",
        "targetValue": "2345",
    },

    # 21. Timestamp in milliseconds
    {
        "sourceKey": "log_time",
        "sourceValue": "1698242400000",
        "targetKey": "date",
        "targetValue": "2023-10-25",
    },

    # 22. Hex number
    {
        "sourceKey": "color_code",
        "sourceValue": "0xFF11AA",
        "targetKey": "hex",
        "targetValue": "FF11AA",
    },

    # 23. Emoji content
    {
        "sourceKey": "comment",
        "sourceValue": "Done ✅",
        "targetKey": "clean_comment",
        "targetValue": "Done",
    },

    # 24. Excel serial date number
    {
        "sourceKey": "excel_date",
        "sourceValue": "45219",
        "targetKey": "date",
        "targetValue": "2023-10-25",
    },

    # 25. Negative number check
    {
        "sourceKey": "balance",
        "sourceValue": "-2500",
        "targetKey": "amount",
        "targetValue": "-2500",
    },
    {
        "sourceKey": "id",
        "sourceValue": "202512",
        "targetKey": "yvhmvh",
        "targetValue": "2500",
    },
    {
        "sourceKey": "date",
        "sourceValue": "20251212",
        "targetKey": "date",
        "targetValue": "2023-10-25",
    },
]


    print("=" * 80)
    print("COMPREHENSIVE DATA FIELD ANALYSIS WITH CONTEXT-AWARE TYPE DETECTION")
    print("=" * 80)
    
    for i, row in enumerate(test_rows, 1):
        analyzer = DataFieldAnalyzer(row)
        result = analyzer.analyze_row()
        
        print(f"\n{'='*80}")
        print(f"Test Case {i}")
        print(f"{'='*80}")
        print(f"Source: {row['sourceKey']} = '{row['sourceValue']}'")
        print(f"  └─ Key Tag: {result['source_key_tag']} | Value Type: {result['source_value_tag']} | Format: {result['source_format']}")
        print(f"Target: {row['targetKey']} = '{row['targetValue']}'")
        print(f"  └─ Key Tag: {result['target_key_tag']} | Value Type: {result['target_value_tag']} | Format: {result['target_format']}")
        print(f"Transformation Needed: {result['transformation_needed']}")
        print(f"Transformation Type: {result['transformation_type']}")
        print(f"Transformation Reason: {result['transformation_reason']}")
        print(f"Transformed Value: '{result['transformed_value']}'")