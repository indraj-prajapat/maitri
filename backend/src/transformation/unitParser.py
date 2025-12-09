import re
from datetime import datetime

# Import the UnitParser (in actual use, you'd do: from unit_parser import UnitParser)
# For this example, we'll include a simplified version inline

class UnitParser:
    """Simplified UnitParser - use the full version from the separate module"""
    
    UNITS = {
        "weight": ["kg", "g", "mg", "lb", "lbs", "oz", "ton", "tons"],
        "distance": ["km", "m", "cm", "mm", "mi", "ft", "in", "yd"],
        "volume": ["l", "ml", "gal", "qt", "pt"],
        "temperature": ["c", "f", "k", "°c", "°f"],
        "time": ["s", "sec", "min", "h", "hr", "d", "day"],
        "speed": ["km/h", "kmph", "mph", "m/s"],
        "currency": ["$", "€", "£", "¥", "₹", "usd", "eur", "gbp"],
        "percentage": ["%", "percent"],
        "quantity": ["pcs", "pc", "unit", "item", "doz"],
    }
    
    def __init__(self):
        self.all_units = []
        self.unit_to_category = {}
        for category, units in self.UNITS.items():
            for unit in units:
                self.all_units.append(unit)
                self.unit_to_category[unit.lower()] = category
        self.all_units.sort(key=len, reverse=True)
        escaped_units = [re.escape(unit) for unit in self.all_units]
        self.unit_pattern = r'|'.join(escaped_units)
    
    # ------------------------------------------------------------------
    # 1.  Two tiny helpers
    # ------------------------------------------------------------------
    def _is_unit_prefix(self, text, start, end):
        """True when the slice text[start:end] is a unit PREFIX (unit-number)."""
        # look-behind: first char before the unit must be whitespace or bol
        if start > 0 and not text[start-1].isspace():
            return False
        # look-ahead: first char after the unit must be whitespace
        if end >= len(text) or not text[end].isspace():
            return False
        return True

    def _is_unit_suffix(self, text, start, end):
        """True when the slice is a unit SUFFIX (number-unit)."""
        # look-behind: first char before the unit must be whitespace
        if start == 0 or not text[start-1].isspace():
            return False
        # look-ahead: first char after the unit must *not* be alphanumeric
        if end < len(text) and text[end].isalnum():
            return False
        return True

    # ------------------------------------------------------------------
    # 2.  The new parse() method
    # ------------------------------------------------------------------
    def parse(self, value_str):
        if not value_str or not isinstance(value_str, str):
            return {
                'has_unit': False,
                'numeric_value': None,
                'unit': None,
                'unit_category': None,
                'original_value': value_str
            }

        text = re.sub(r"[\u200b\u200c\u200d]", "", value_str.strip())

        # 1.  number-unit  (suffix)  – must have at least one space between
        suffix_re = rf'([+-]?\d+(?:\.\d+)?)\s+({self.unit_pattern})(?!\w)'
        m = re.search(suffix_re, text, re.I)
        if m and self._is_unit_suffix(text, m.start(2), m.end(2)):
            numeric, unit = m.group(1), m.group(2).lower()
            return {
                'has_unit': True,
                'numeric_value': numeric,
                'unit': unit,
                'unit_category': self.unit_to_category.get(unit, 'unknown'),
                'original_value': value_str
            }

        # 2.  unit-number  (prefix)  – must have at least one space between
        prefix_re = rf'({self.unit_pattern})\s+([+-]?\d+(?:\.\d+)?)'
        m = re.search(prefix_re, text, re.I)
        if m and self._is_unit_prefix(text, m.start(1), m.end(1)):
            unit, numeric = m.group(1).lower(), m.group(2)
            return {
                'has_unit': True,
                'numeric_value': numeric,
                'unit': unit,
                'unit_category': self.unit_to_category.get(unit, 'unknown'),
                'original_value': value_str
            }

        # 3.  nothing matched
        return {
            'has_unit': False,
            'numeric_value': None,
            'unit': None,
            'unit_category': None,
            'original_value': value_str
        }