"""
FINAL: Simplified Field Similarity Scorer

KEY RULE: If null/NaN/blank is present on ANY side → Score = 100

This scorer calculates similarity (0-100) using ONLY:
- source_value_tag
- target_value_tag

Special Null Handling:
✅ Both null → 100
✅ One null → 100
✅ null + any type → 100
"""

class SimpleFieldSimilarityScorer:
    """
    Calculate similarity score (0-100) based ONLY on value tags.
    
    IMPORTANT NULL RULE:
    If null/NaN/blank appears on either or both sides → ALWAYS return 100
    
    This means:
    - null + null = 100
    - null + integer = 100
    - null + string = 100
    - nan + anything = 100
    - blank + anything = 100
    """
    
    # Group value tags into categories
    TYPE_CATEGORIES = {
        "numeric": {
            "integer", 
            "float", 
            "numeric_with_unit"
        },
        "temporal": {
            "date", 
            "datetime"
        },
        "boolean": {
            "boolean"
        },
        "string": {
            "string_code", 
            "string_numeric_id", 
            "string_category_code",
            "string_phrase", 
            "string_address", 
            "string_name_category",
            "string_plain", 
            "string_email", 
            "string_url", 
            "string_phone",
            "string_uuid", 
            "string_with_unit"
        },
        "null_like": {
            "null",
            "nan",
            "blank",
            "empty",
            "missing"
        }
    }
    
    def get_category(self, value_tag):
        """Get the category of a value tag."""
        if not value_tag:
            return "null_like"
        
        value_tag_lower = str(value_tag).lower()
        
        for category, tags in self.TYPE_CATEGORIES.items():
            if value_tag_lower in tags:
                return category
        
        return "unknown"
    
    def is_null_like(self, value_tag):
        """Check if a value tag represents a null-like value."""
        if not value_tag:
            return True
        
        value_tag_lower = str(value_tag).lower()
        return value_tag_lower in self.TYPE_CATEGORIES["null_like"]
    
    def calculate_similarity(self, source_value_tag, target_value_tag):
        """
        Calculate similarity score based ONLY on value tags.
        
        Args:
            source_value_tag (str): Source field value tag
            target_value_tag (str): Target field value tag
            
        Returns:
            dict: {
                'similarity_score': int (0-100),
                'source_tag': str,
                'target_tag': str,
                'source_category': str,
                'target_category': str,
                'match_type': str,
                'explanation': str,
                'has_null_like': bool
            }
        """
        
        # Normalize tags
        src_tag = str(source_value_tag).lower() if source_value_tag else "null"
        tgt_tag = str(target_value_tag).lower() if target_value_tag else "null"
        
        # Check if either is null-like
        src_is_null = self.is_null_like(src_tag)
        tgt_is_null = self.is_null_like(tgt_tag)
        
        # Get categories
        src_category = self.get_category(src_tag)
        tgt_category = self.get_category(tgt_tag)
        
        # ==================================================
        # PRIORITY 0: NULL RULE - ALWAYS RETURN 100
        # ==================================================
        if src_is_null or tgt_is_null:
            # Determine which side(s) have null
            if src_is_null and tgt_is_null:
                match_type = 'NULL_BOTH_SIDES'
                explanation = f'Both are null-like ({src_tag} and {tgt_tag}) - always compatible'
            elif src_is_null:
                match_type = 'NULL_SOURCE_SIDE'
                explanation = f'Source is null-like ({src_tag}) - always compatible regardless of target type'
            else:
                match_type = 'NULL_TARGET_SIDE'
                explanation = f'Target is null-like ({tgt_tag}) - always compatible regardless of source type'
            
            return {
                'similarity_score': 100,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': match_type,
                'explanation': explanation,
                'has_null_like': True
            }
        
        # ==================================================
        # RULE 1: EXACT MATCH (no null values)
        # ==================================================
        if src_tag == tgt_tag:
            return {
                'similarity_score': 100,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'EXACT_MATCH',
                'explanation': f'Perfect match: both are {src_tag}',
                'has_null_like': False
            }
        
        # ==================================================
        # RULE 2: SAME CATEGORY - HIGH SIMILARITY
        # ==================================================
        if src_category == tgt_category and src_category != "unknown":
            
            # --- NUMERIC CATEGORY ---
            if src_category == "numeric":
                if {src_tag, tgt_tag} == {"integer", "float"}:
                    return {
                        'similarity_score': 90,
                        'source_tag': src_tag,
                        'target_tag': tgt_tag,
                        'source_category': src_category,
                        'target_category': tgt_category,
                        'match_type': 'NUMERIC_COMPATIBLE',
                        'explanation': 'Both numeric: integer and float are highly compatible',
                        'has_null_like': False
                    }
                
                if "numeric_with_unit" in {src_tag, tgt_tag}:
                    return {
                        'similarity_score': 80,
                        'source_tag': src_tag,
                        'target_tag': tgt_tag,
                        'source_category': src_category,
                        'target_category': tgt_category,
                        'match_type': 'NUMERIC_WITH_UNIT',
                        'explanation': 'Both numeric but one has unit attached',
                        'has_null_like': False
                    }
                
                return {
                    'similarity_score': 85,
                    'source_tag': src_tag,
                    'target_tag': tgt_tag,
                    'source_category': src_category,
                    'target_category': tgt_category,
                    'match_type': 'SAME_NUMERIC_CATEGORY',
                    'explanation': 'Both are numeric types',
                    'has_null_like': False
                }
            
            # --- TEMPORAL CATEGORY ---
            elif src_category == "temporal":
                return {
                    'similarity_score': 85,
                    'source_tag': src_tag,
                    'target_tag': tgt_tag,
                    'source_category': src_category,
                    'target_category': tgt_category,
                    'match_type': 'TEMPORAL_COMPATIBLE',
                    'explanation': 'Both temporal: date and datetime are compatible',
                    'has_null_like': False
                }
            
            # --- STRING CATEGORY ---
            elif src_category == "string":
                if "code" in src_tag and "code" in tgt_tag:
                    score = 90
                    explanation = 'Both are code-type strings (highly compatible)'
                elif "numeric_id" in src_tag or "numeric_id" in tgt_tag:
                    score = 85
                    explanation = 'Both strings, one is numeric ID'
                elif "email" in {src_tag, tgt_tag} or "url" in {src_tag, tgt_tag}:
                    score = 75
                    explanation = 'Both strings but one has specific format (email/url)'
                else:
                    score = 80
                    explanation = 'Both are string types'
                
                return {
                    'similarity_score': score,
                    'source_tag': src_tag,
                    'target_tag': tgt_tag,
                    'source_category': src_category,
                    'target_category': tgt_category,
                    'match_type': 'SAME_STRING_CATEGORY',
                    'explanation': explanation,
                    'has_null_like': False
                }
            
            # --- BOOLEAN CATEGORY ---
            elif src_category == "boolean":
                return {
                    'similarity_score': 100,
                    'source_tag': src_tag,
                    'target_tag': tgt_tag,
                    'source_category': src_category,
                    'target_category': tgt_category,
                    'match_type': 'BOOLEAN_MATCH',
                    'explanation': 'Both are boolean',
                    'has_null_like': False
                }
        
        # ==================================================
        # RULE 3: CROSS-CATEGORY - MODERATE SIMILARITY
        # ==================================================
        
        if src_category == "unknown" or tgt_category == "unknown":
            return {
                'similarity_score': 10,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'UNKNOWN_TYPE',
                'explanation': 'One or both types are unknown',
                'has_null_like': False
            }
        
        if {src_category, tgt_category} == {"numeric", "string"}:
            return {
                'similarity_score': 55,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'NUMERIC_STRING_CONVERSION',
                'explanation': 'Numeric and string - conversion possible but not ideal',
                'has_null_like': False
            }
        
        if {src_category, tgt_category} == {"temporal", "string"}:
            return {
                'similarity_score': 50,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'TEMPORAL_STRING_CONVERSION',
                'explanation': 'Date/time and string - conversion possible but requires formatting',
                'has_null_like': False
            }
        
        if {src_category, tgt_category} == {"boolean", "string"}:
            return {
                'similarity_score': 45,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'BOOLEAN_STRING_CONVERSION',
                'explanation': 'Boolean and string - simple conversion possible',
                'has_null_like': False
            }
        
        if {src_category, tgt_category} == {"boolean", "numeric"}:
            return {
                'similarity_score': 40,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'BOOLEAN_NUMERIC_CONVERSION',
                'explanation': 'Boolean and numeric - conversion via 0/1 possible',
                'has_null_like': False
            }
        
        # ==================================================
        # RULE 4: INCOMPATIBLE - LOW SIMILARITY
        # ==================================================
        if {src_category, tgt_category} == {"numeric", "temporal"}:
            return {
                'similarity_score': 15,
                'source_tag': src_tag,
                'target_tag': tgt_tag,
                'source_category': src_category,
                'target_category': tgt_category,
                'match_type': 'INCOMPATIBLE',
                'explanation': 'Numeric and date/time - incompatible without context',
                'has_null_like': False
            }
        
        return {
            'similarity_score': 10,
            'source_tag': src_tag,
            'target_tag': tgt_tag,
            'source_category': src_category,
            'target_category': tgt_category,
            'match_type': 'INCOMPATIBLE',
            'explanation': f'Incompatible types: {src_category} and {tgt_category}',
            'has_null_like': False
        }


# =============================================================================
# USAGE EXAMPLES - DEMONSTRATING NULL = 100 RULE
# =============================================================================

if __name__ == '__main__':
    
    scorer = SimpleFieldSimilarityScorer()
    
    print("="*80)
    print("FINAL SIMILARITY SCORER - NULL ALWAYS = 100")
    print("="*80)
    
    print("\n" + "="*80)
    print("KEY RULE: If null/NaN/blank on ANY side → Score = 100")
    print("="*80)
    
    # Demonstrate the NULL = 100 rule
    null_examples = [
        ("null", "null", "Both null"),
        ("null", "integer", "Null + Integer"),
        ("null", "string_code", "Null + String"),
        ("nan", "float", "NaN + Float"),
        ("blank", "date", "Blank + Date"),
        ("null", "boolean", "Null + Boolean"),
    ]
    
    print("\nNULL EXAMPLES (All should be 100):")
    print("-" * 80)
    for src, tgt, desc in null_examples:
        result = scorer.calculate_similarity(src, tgt)
        print(f"{desc:25} | {src:15} → {tgt:15} | Score: {result['similarity_score']:3}")
    
    # Regular examples (no null)
    print("\n" + "="*80)
    print("REGULAR EXAMPLES (No null - normal scoring):")
    print("-" * 80)
    
    regular_examples = [
        ("integer", "integer", "Exact match"),
        ("integer", "float", "Same category"),
        ("string_code", "string_plain", "Same category"),
        ("integer", "string_plain", "Cross-category"),
        ("date", "integer", "Incompatible"),
    ]
    
    for src, tgt, desc in regular_examples:
        result = scorer.calculate_similarity(src, tgt)
        print(f"{desc:25} | {src:15} → {tgt:15} | Score: {result['similarity_score']:3}")
    
    print("\n" + "="*80)
    print("SUMMARY")
    print("="*80)
    print("✅ ANY null/NaN/blank → Score = 100 (always compatible)")
    print("📊 No null → Score = 10-100 (based on type compatibility)")