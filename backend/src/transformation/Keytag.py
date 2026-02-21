"""
Schema Tag Similarity Scoring Module

This module provides semantic tag-based similarity scoring for database schema fields,
API parameters, and other structured data attributes. It helps identify potential
matches between fields based on their semantic meaning rather than exact string matching.

Example Usage:
    >>> from schema_tag_similarity import schema_tag_similarity_score, get_tag
    >>> 
    >>> # Compare two field names
    >>> score = schema_tag_similarity_score("user.customer_id", "account.user_identifier")
    >>> print(f"Similarity: {score}")  # Output: 0.95 (both are ID fields)
    >>> 
    >>> # Get tag for a field
    >>> tag = get_tag("order.created_timestamp")
    >>> print(tag)  # Output: DATETIME
"""

from enum import Enum
from typing import Dict, Tuple, Set, FrozenSet
import re


class TagType(Enum):
    """Enumeration of semantic tags for schema attributes."""
    ID = "ID"
    NAME = "NAME"
    DESCRIPTION = "DESCRIPTION"
    DATETIME = "DATETIME"
    CATEGORY = "CATEGORY"
    AMOUNT = "AMOUNT"
    QUANTITY = "QUANTITY"
    BOOLEAN = "BOOLEAN"
    LOCATION = "LOCATION"
    CONTACT = "CONTACT"
    REFERENCE = "REFERENCE"
    METADATA = "METADATA"
    OTHER = "OTHER"


# Comprehensive keyword patterns for each tag type
TAG_PATTERNS: Dict[TagType, Set[str]] = {
    TagType.ID: {
        # Primary identifiers
        'id', 'key', 'code', 'identifier', 'guid', 'uuid', 'pk',
        # Suffixes and variations (with underscores for word boundaries)
        '_id', 'id_', '_key', 'key_', '_code', 'code_',
        # Numeric identifiers (with underscores for word boundaries)
        '_num', 'num_', '_no', 'no_', '_number', 'number_', 'sequence', 'seq',
        # References (when standalone)
        'ref', 'reference_id'
    },
    
    TagType.NAME: {
        'name', 'title', 'label', 'caption', 'heading',
        'display_name', 'full_name', 'first_name', 'last_name',
        'username', 'user_name', 'alias', 'nickname'
    },
    
    TagType.DESCRIPTION: {
        'desc', 'description', 'info', 'information', 'note', 'notes',
        'comment', 'comments', 'details', 'summary', 'content',
        'text', 'body', 'message', 'remarks', 'explanation', 'overview'
    },
    
    TagType.DATETIME: {
        # Date and time
        'date', 'time', 'datetime', 'timestamp', 'dt',
        # Specific timestamps
        'created', 'updated', 'modified', 'deleted', 'last_modified',
        'start', 'end', 'begin', 'finish', 'expires', 'expiry',
        # Date components
        'year', 'month', 'day', 'hour', 'minute', 'second',
        # Temporal references
        'at', 'when', 'scheduled', 'due'
    },
    
    TagType.CATEGORY: {
        'status', 'state', 'flag', 'type', 'category', 'class',
        'kind', 'classification', 'group', 'role', 'level',
        'tier', 'grade', 'rank', 'priority', 'severity',
        'stage', 'phase', 'mode', 'variant', 'genre'
    },
    
    TagType.AMOUNT: {
        'amount', 'price', 'cost', 'value', 'total', 'subtotal',
        'fee', 'charge', 'rate', 'balance', 'payment', 'refund',
        'revenue', 'income', 'expense', 'salary', 'wage',
        'tax', 'discount', 'premium', 'sum'
    },
    
    TagType.QUANTITY: {
        'quantity', 'count', 'qty', 'size', 'length', 'width',
        'height', 'weight', 'volume', 'capacity', 'limit',
        'max', 'min', 'threshold', 'duration', 'period',
        'score', 'rating', 'percentage', 'percent', 'ratio',
        # Add total_quantity pattern
        'total_quantity', 'total_count', 'total_qty'
    },
    
    TagType.BOOLEAN: {
        'is', 'has', 'can', 'should', 'active', 'enabled',
        'disabled', 'verified', 'confirmed', 'approved',
        'deleted', 'archived', 'published', 'visible',
        'public', 'private', 'required', 'optional'
    },
    
    TagType.LOCATION: {
        'address', 'street', 'city', 'state', 'country', 'region',
        'zip', 'zipcode', 'postal', 'postcode', 'location',
        'latitude', 'lat', 'longitude', 'lng', 'lon', 'coordinates',
        'place', 'venue', 'site', 'position'
    },
    
    TagType.CONTACT: {
        'email', 'phone', 'mobile', 'telephone', 'fax',
        'contact', 'url', 'website', 'link', 'social',
        'twitter', 'facebook', 'linkedin', 'instagram'
    },
    
    TagType.REFERENCE: {
        'ref', 'reference', 'link', 'pointer', 'foreign_key', 'fk',
        'parent', 'child', 'related', 'associated', 'linked'
    },
    
    TagType.METADATA: {
        'meta', 'metadata', 'version', 'revision', 'hash',
        'checksum', 'etag', 'token', 'session', 'source',
        'origin', 'owner', 'creator', 'author', 'by'
    }
}


def normalize_attribute_name(key: str) -> str:
    """
    Normalize attribute name by extracting the last component and cleaning it.
    
    Args:
        key: Full key path (e.g., "user.profile.email_address")
        
    Returns:
        Normalized attribute name (e.g., "email_address")
        
    Examples:
        >>> normalize_attribute_name("user.customer_id")
        'customer_id'
        >>> normalize_attribute_name("camelCaseField")
        'camel_case_field'
    """
    if not key or not isinstance(key, str):
        return ""
    
    # Extract last component after dot notation
    attr = key.split('.')[-1]
    
    # Convert camelCase to snake_case
    attr = re.sub('([a-z0-9])([A-Z])', r'\1_\2', attr)
    
    # Clean and normalize
    attr = attr.lower().strip()
    attr = re.sub(r'[^a-z0-9_]', '_', attr)  # Replace special chars with underscore
    attr = re.sub(r'_+', '_', attr)  # Collapse multiple underscores
    attr = attr.strip('_')  # Remove leading/trailing underscores
    
    return attr

def get_tag(key: str) -> TagType:
    """
    Extract semantic tag from a schema attribute key.
    
    This function analyzes the attribute name and assigns a semantic tag
    based on keyword matching. It splits the key by multiple delimiters
    (camelCase, snake_case, kebab-case, dots) and checks each component.
    
    Args:
        key: Attribute key (e.g., "user.email_address", "createdAt", "customer_id")
        
    Returns:
        TagType enum representing the semantic category
        
    Examples:
        >>> get_tag("user.customer_id")
        <TagType.ID: 'ID'>
        >>> get_tag("product.description")
        <TagType.DESCRIPTION: 'DESCRIPTION'>
        >>> get_tag("order.total_amount")
        <TagType.AMOUNT: 'AMOUNT'>
    """
    attr = normalize_attribute_name(key)
    
    if not attr:
        return TagType.OTHER
    
    # Split the attribute into components by multiple delimiters
    components = _split_into_components(attr)
    
    # Check for exact matches first (most specific)
    for tag_type, patterns in TAG_PATTERNS.items():
        # Check full normalized attribute
        if attr in patterns:
            return tag_type
        # Check individual components
        for component in components:
            if component in patterns:
                return tag_type
    
    # Special handling for ID to avoid false positives
    if tag_type := _check_id_field(attr, components):
        return tag_type
    
    # Check for substring matches (broader matching)
    # Priority order matters: check more specific tags first
    priority_order = [
        TagType.BOOLEAN,      # Check before CATEGORY
        TagType.CONTACT,      # Check before REFERENCE
        TagType.LOCATION,     # Check before REFERENCE
        TagType.DESCRIPTION,  # Check before DATETIME
        TagType.AMOUNT,       # Check before QUANTITY
        TagType.NAME,
        TagType.CATEGORY,     # Check before DATETIME
        TagType.DATETIME,     # After CATEGORY
        TagType.QUANTITY,
        TagType.REFERENCE,
        TagType.METADATA,
    ]
    
    for tag_type in priority_order:
        patterns = TAG_PATTERNS[tag_type]
        for pattern in patterns:
            # Check full attribute
            if pattern in attr:
                return tag_type
            # Check individual components
            for component in components:
                if pattern in component or component in pattern:
                    return tag_type
    
    return TagType.OTHER


def _split_into_components(attr: str) -> list[str]:
    """
    Split attribute name into components by various delimiters and camelCase.
    
    Args:
        attr: Normalized attribute name
        
    Returns:
        List of component strings (all lowercase)
        
    Examples:
        >>> _split_into_components("user_id")
        ['user', 'id']
        >>> _split_into_components("userId")
        ['user', 'id']
        >>> _split_into_components("IMONumber")
        ['imo', 'number']
        >>> _split_into_components("customer-email-address")
        ['customer', 'email', 'address']
    """
    if not attr:
        return []
    
    # Step 1: Split by common delimiters (_, -, /, ., space)
    components = re.split(r'[_\-/.\s]+', attr)
    
    # Step 2: Further split each component by camelCase
    final_components = []
    for component in components:
        if not component:
            continue
        
        # Split camelCase: insert space before uppercase letters
        # Handle sequences of capitals (e.g., "IMONumber" -> "IMO Number")
        spaced = re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', component)
        spaced = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1 \2', spaced)
        
        # Split by the spaces we just inserted
        sub_components = spaced.split()
        
        # Add all sub-components as lowercase
        final_components.extend([c.lower() for c in sub_components if c])
    
    return final_components


def _check_id_field(attr: str, components: list[str] = None) -> TagType | None:
    """
    Special check for ID fields to avoid false positives.
    Returns TagType.ID if it's a real ID field, None otherwise.
    
    Args:
        attr: Full normalized attribute name
        components: Optional list of attribute components
    
    Examples:
        'user_id' → ID (valid)
        'userId' → ID (valid)
        'id' → ID (valid)
        'raid' → None (false positive)
        'IMONumber' → ID (valid - 'number' component)
    """
    if components is None:
        components = _split_into_components(attr)
    
    attr_lower = attr.lower()
    
    # Exact match
    if attr_lower == 'id' or 'id' in components:
        return TagType.ID
    
    # Check if any component is an ID keyword
    id_keywords = ['id', 'key', 'code', 'identifier', 'guid', 'uuid', 'pk', 
                   'number', 'num', 'no', 'sequence', 'seq']
    
    for component in components:
        if component in id_keywords:
            return TagType.ID
    
    # Ends with _id or id_ (most common pattern in snake_case)
    if attr_lower.endswith('_id') or attr_lower.endswith('id_') or \
       attr_lower.startswith('id_') or attr_lower.startswith('_id'):
        return TagType.ID
    
    # Contains _id_ in the middle
    if '_id_' in attr_lower:
        return TagType.ID
    
    # CamelCase pattern: ends with 'Id'
    if len(attr) >= 2 and (attr[-2:] == 'Id' or attr[-2:] == 'ID'):
        return TagType.ID
    
    # Check for Id in the middle of camelCase
    if 'Id' in attr and attr.index('Id') > 0:
        idx = attr.index('Id')
        if idx + 2 >= len(attr) or attr[idx + 2].isupper():
            return TagType.ID
    
    return None



# Similarity score matrix: defines how similar different tag types are
# Scores range from 0.0 (completely incompatible) to 1.0 (identical)
SIMILARITY_MATRIX: Dict[FrozenSet[TagType], float] = {
    # Perfect matches (same semantic meaning) - 1.00 (100) for identical types
    frozenset([TagType.ID]): 1.00,
    frozenset([TagType.NAME]): 1.00,
    frozenset([TagType.DESCRIPTION]): 1.00,
    frozenset([TagType.DATETIME]): 1.00,
    frozenset([TagType.CATEGORY]): 1.00,
    frozenset([TagType.AMOUNT]): 1.00,
    frozenset([TagType.QUANTITY]): 1.00,
    frozenset([TagType.BOOLEAN]): 1.00,
    frozenset([TagType.LOCATION]): 1.00,
    frozenset([TagType.CONTACT]): 1.00,
    frozenset([TagType.REFERENCE]): 1.00,
    frozenset([TagType.METADATA]): 1.00,
    frozenset([TagType.OTHER]): 0.90,  # Lower score for unknown fields
    
    # High compatibility (very similar semantic meaning)
    frozenset([TagType.NAME, TagType.DESCRIPTION]): 0.85,
    frozenset([TagType.AMOUNT, TagType.QUANTITY]): 0.80,
    frozenset([TagType.ID, TagType.REFERENCE]): 0.80,
    frozenset([TagType.CATEGORY, TagType.METADATA]): 0.75,
    
    # Moderate compatibility (related but distinct)
    frozenset([TagType.ID, TagType.METADATA]): 0.65,
    frozenset([TagType.NAME, TagType.CONTACT]): 0.60,
    frozenset([TagType.CATEGORY, TagType.BOOLEAN]): 0.60,
    frozenset([TagType.REFERENCE, TagType.METADATA]): 0.60,
    frozenset([TagType.LOCATION, TagType.CONTACT]): 0.55,
    frozenset([TagType.DESCRIPTION, TagType.METADATA]): 0.55,
    
    # Low compatibility (semantically different but not incompatible)
    frozenset([TagType.ID, TagType.NAME]): 0.40,
    frozenset([TagType.DATETIME, TagType.METADATA]): 0.40,
    frozenset([TagType.QUANTITY, TagType.CATEGORY]): 0.35,
    frozenset([TagType.BOOLEAN, TagType.ID]): 0.30,
    
    # Very low compatibility (semantically incompatible)
    frozenset([TagType.ID, TagType.DESCRIPTION]): 0.15,
    frozenset([TagType.AMOUNT, TagType.DATETIME]): 0.15,
    frozenset([TagType.LOCATION, TagType.AMOUNT]): 0.15,
    frozenset([TagType.CONTACT, TagType.QUANTITY]): 0.15,
    frozenset([TagType.BOOLEAN, TagType.AMOUNT]): 0.10,
    frozenset([TagType.DATETIME, TagType.AMOUNT]): 0.10,
}


def schema_tag_similarity_score(src_key: str, tgt_key: str) -> float:
    """
    Calculate similarity score (0.0–1.0) between two schema attributes based on their semantic tags.
    
    This function compares two attribute keys by:
    1. Extracting their semantic tags
    2. Looking up the predefined similarity score for that tag pair
    3. Returning a score where 1.0 (100) = perfect match (identical tags), 0.0 = completely incompatible
    
    The score is purely semantic and does not consider:
    - String similarity of the attribute names
    - Data type compatibility
    - Actual values in the fields
    
    Args:
        src_key: Source attribute key (e.g., "user.customer_id")
        tgt_key: Target attribute key (e.g., "account.user_identifier")
        
    Returns:
        Float between 0.0 and 1.0 representing semantic similarity
        
    Raises:
        ValueError: If either key is None or empty
        
    Examples:
        >>> schema_tag_similarity_score("user.id", "customer.identifier")
        1.00  # Both are ID fields - perfect match
        
        >>> schema_tag_similarity_score("user.full_name", "product.description")
        0.85  # NAME and DESCRIPTION are compatible
        
        >>> schema_tag_similarity_score("order.total_amount", "user.created_at")
        0.10  # AMOUNT and DATETIME are incompatible
    """
    # Input validation
    if not src_key or not isinstance(src_key, str):
        raise ValueError(f"Invalid src_key: {src_key!r}")
    if not tgt_key or not isinstance(tgt_key, str):
        raise ValueError(f"Invalid tgt_key: {tgt_key!r}")
    
    # Get tags for both keys
    tag1 = get_tag(src_key)
    tag2 = get_tag(tgt_key)
    
    # Create a frozenset for lookup (order doesn't matter)
    tag_pair = frozenset([tag1, tag2])
    
    # Look up similarity score in matrix
    score = SIMILARITY_MATRIX.get(tag_pair)
    
    if score is not None:
        return score
    
    # Default fallback for unknown combinations
    # If one is OTHER, give it a generic low score
    if TagType.OTHER in tag_pair:
        return .9
    
    # For any other unknown combination, assume low compatibility
    return .95


def get_similarity_explanation(src_key: str, tgt_key: str) -> Dict[str, any]:
    """
    Get detailed explanation of similarity score between two attributes.
    
    Args:
        src_key: Source attribute key
        tgt_key: Target attribute key
        
    Returns:
        Dictionary containing:
            - score: The similarity score
            - src_tag: Tag assigned to source
            - tgt_tag: Tag assigned to target
            - relationship: Description of the relationship
            
    Examples:
        >>> explain = get_similarity_explanation("user.id", "customer.code")
        >>> print(explain)
        {
            'score': 0.95,
            'src_tag': 'ID',
            'tgt_tag': 'ID',
            'relationship': 'Identical semantic meaning'
        }
    """
    tag1 = get_tag(src_key)
    tag2 = get_tag(tgt_key)
    score = schema_tag_similarity_score(src_key, tgt_key)
    
    # Determine relationship description
    if tag1 == tag2:
        relationship = "Identical semantic meaning"
    elif score >= 0.80:
        relationship = "Very high compatibility"
    elif score >= 0.60:
        relationship = "Moderate compatibility"
    elif score >= 0.40:
        relationship = "Low compatibility"
    else:
        relationship = "Incompatible or unrelated"
    
    return {
        'score': score,
        'src_key': src_key,
        'tgt_key': tgt_key,
        'src_tag': tag1.value,
        'tgt_tag': tag2.value,
        'relationship': relationship,
        'src_normalized': normalize_attribute_name(src_key),
        'tgt_normalized': normalize_attribute_name(tgt_key)
    }


# Convenience function for batch processing
def compare_schema_fields(src_fields: list, tgt_fields: list, threshold: float = 0.5) -> list:
    """
    Compare two lists of schema fields and return potential matches.
    
    Args:
        src_fields: List of source field names
        tgt_fields: List of target field names
        threshold: Minimum similarity score to include in results (default: 0.5)
        
    Returns:
        List of dictionaries with match information, sorted by score (descending)
        
    Examples:
        >>> src = ["user.id", "user.email", "user.created_at"]
        >>> tgt = ["customer.identifier", "customer.contact_email", "customer.signup_date"]
        >>> matches = compare_schema_fields(src, tgt, threshold=0.6)
        >>> for match in matches:
        ...     print(f"{match['src_key']} -> {match['tgt_key']}: {match['score']}")
    """
    results = []
    
    for src in src_fields:
        for tgt in tgt_fields:
            try:
                explanation = get_similarity_explanation(src, tgt)
                if explanation['score'] >= threshold:
                    results.append(explanation)
            except (ValueError, Exception) as e:
                # Log error but continue processing
                print(f"Warning: Error comparing {src} and {tgt}: {e}")
                continue
    
    # Sort by score (highest first)
    results.sort(key=lambda x: x['score'], reverse=True)
    
    return results


if __name__ == "__main__":
    # Example usage and testing
    print("Schema Tag Similarity Scoring - Examples\n")
    print("=" * 60)
    
    test_pairs = [

        # =====================================================
        # 1. STRONG SEMANTIC + TAG MATCHES (should score high)
        # =====================================================
        ("user.id", "IMONumber"),
        ("user.email", "contact.email_address"),
        ("order.total_amount", "invoice.total_price"),
        ("user.created_at", "account.signup_timestamp"),
        ("product.name", "item.title"),
        ("product.description", "item.description"),
        ("status.is_active", "state.enabled"),
        ("order.order_date", "invoice.issue_date"),
        ("user.phone_number", "contact.mobile"),
        ("shipment.tracking_id", "delivery.tracking_number"),

        # =====================================================
        # 2. SAME TAG, DIFFERENT CATEGORY (category-sensitive)
        # =====================================================
        ("user.id", "ODERId"),
        ("product.id", "category.id"),
        ("account.status", "order.status"),
        ("user.name", "company.name"),
        ("order.created_at", "user.created_at"),
        ("payment.amount", "order.amount"),

        # =====================================================
        # 3. SAME CATEGORY, DIFFERENT TAG (should be moderate)
        # =====================================================
        ("user.first_name", "user.last_name"),
        ("order.total_amount", "order.tax_amount"),
        ("product.weight", "productPrice"),
        ("account.start_date", "account.end_date"),
        ("shipmentSource_port", "shipment.destination_port"),

        # =====================================================
        # 4. FORMAT / NAMING VARIATIONS (robust parsing test)
        # =====================================================
        ("USERID", "user_id"),
        ("user-id", "user.id"),
        ("UserCreatedAt", "user.created_at"),
        ("orderTotalAmount", "order.total_amount"),
        ("customerEmailAddress", "customer.email_address"),
        ("isActive", "is_active"),

        # =====================================================
        # 5. ABBREVIATIONS & SHORT FORMS
        # =====================================================
        ("qty", "quantity"),
        ("amt", "amount"),
        ("addr", "address"),
        ("dob", "date_of_birth"),
        ("no_of_items", "item_count"),
        ("cnt", "count"),

        # =====================================================
        # 6. BOOLEAN & FLAG FIELDS
        # =====================================================
        ("is_active", "enabled"),
        ("has_access", "access_flag"),
        ("is_deleted", "deleted"),
        ("is_verified", "verified"),
        ("active_status", "is_active"),

        # =====================================================
        # 7. TEMPORAL / DATE CONFUSIONS (semantic closeness)
        # =====================================================
        ("created_at", "updated_at"),
        ("start_date", "end_date"),
        ("signup_date", "last_login"),
        ("order_date", "delivery_date"),
        ("timestamp", "event_time"),

        # =====================================================
        # 8. NUMERIC MEASURE CONFUSIONS
        # =====================================================
        ("price", "cost"),
        ("total_amount", "net_amount"),
        ("gross_weight", "net_weight"),
        ("discount", "tax"),
        ("revenue", "profit"),

        # =====================================================
        # 9. FALSE FRIENDS (should score LOW)
        # =====================================================
        ("user.id", "user.name"),
        ("price.amount", "created.at"),
        ("status", "timestamp"),
        ("email", "phone"),
        ("address", "amount"),
        ("name", "date"),

        # =====================================================
        # 10. CROSS-DOMAIN COLLISIONS (important for M×N)
        # =====================================================
        ("vessel.id", "user.id"),
        ("voyage.number", "order.number"),
        ("port.code", "country.code"),
        ("shipment.status", "user.status"),
        ("container.size", "file.size"),

        # =====================================================
        # 11. VERY SHORT / AMBIGUOUS TOKENS (hard cases)
        # =====================================================
        ("id", "code"),
        ("no", "number"),
        ("val", "value"),
        ("nm", "name"),
        ("dt", "date"),

        # =====================================================
        # 12. EMPTY / EDGE-LIKE STRUCTURES (defensive coding)
        # =====================================================
        ("user.", "user.id"),
        (".id", "user.id"),
        ("__", "id"),
        ("-", "_"),
        ("-", "user.id"),

        # =====================================================
        # 13. MULTI-LEVEL NESTED KEYS
        # =====================================================
        ("document.exchange.receiving_party.id",
        "doc_exchange.receiver.party_id"),
        ("vessel.movement.port_clearance_date",
        "voyage.port_clearance.timestamp"),
        ("invoice.payment.transaction.reference_id",
        "payment.txn.ref_id"),

        # =====================================================
        # 14. PLURALIZATION & GRAMMAR
        # =====================================================
        ("user.addresses", "user.address"),
        ("orders.count", "order_count"),
        ("items", "item"),
        ("children", "child"),

        # =====================================================
        # 15. NEGATION / OPPOSITE MEANINGS (should reduce score)
        # =====================================================
        ("is_active", "is_inactive"),
        ("enabled", "disabled"),
        ("success", "failure"),
        ("approved", "rejected"),
    ]

    explanation = get_similarity_explanation('IMONumber', 'Imo-Number')
    # print(f"\n{src} <-> {tgt}")
    print(f"  Tags: {explanation['src_tag']} <-> {explanation['tgt_tag']}")
    print(f"  Score: {explanation['score']:.2f}")
    print(f"  Relationship: {explanation['relationship']}")
    # for src, tgt in test_pairs:
    #     explanation = get_similarity_explanation(src, tgt)
    #     print(f"\n{src} <-> {tgt}")
    #     print(f"  Tags: {explanation['src_tag']} <-> {explanation['tgt_tag']}")
    #     print(f"  Score: {explanation['score']:.2f}")
    #     print(f"  Relationship: {explanation['relationship']}")
    
    # print("\n" + "=" * 60)
    # print("\nBatch Comparison Example:\n")
    
    # source_fields = ["user.id", "user.email", "user.created_at", "user.total_orders"]
    # target_fields = ["customer.customer_id", "customer.email_address", 
    #                  "customer.signup_date", "customer.order_count"]
    
    # matches = compare_schema_fields(source_fields, target_fields, threshold=0.6)
    
    # print(f"Found {len(matches)} matches with score >= 0.6:\n")
    # for match in matches:
    #     print(f"{match['src_key']:25} -> {match['tgt_key']:30} "
    #           f"[{match['score']:.2f}] {match['relationship']}")