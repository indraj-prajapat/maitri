#!/usr/bin/env python3
"""
Semantic Transformation Engine – v2
Production-grade, pluggable, thread-safe, fully typed.
Author: you
"""
from __future__ import annotations

import re
import json
import time
import locale as _locale
import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from decimal import Decimal, InvalidOperation
from datetime import datetime
from enum import Enum
from typing import (
    Any, Callable, Dict, List, Optional, Tuple, Type, Union, Sequence
)
from functools import lru_cache

try:
    import pandas as pd  # type: ignore
except ModuleNotFoundError:  # pragma: no cover
    pd = None  # type: ignore


# ---------------------------------------------------------------------------
#  Enums
# ---------------------------------------------------------------------------
class DataType(Enum):
    DATE = "date"
    TIME = "time"
    DATETIME = "datetime"
    NUMERIC = "numeric"
    CODE = "code"
    STRING = "string"
    BOOLEAN = "boolean"
    UNKNOWN = "unknown"


# ---------------------------------------------------------------------------
#  Deep-type detector for plain strings
# ---------------------------------------------------------------------------
_DEEP_TYPE_PATTERNS: List[Tuple[DataType, str, float, str]] = [
    # (data_type, regex, confidence, format_name)
    (DataType.BOOLEAN, r"^(true|false|yes|no|y|n|1|0)$", 0.95, "BOOLEAN"),
    (DataType.NUMERIC, r"^-?\d+$", 0.95, "INTEGER"),
    (DataType.NUMERIC, r"^-?\d+\.\d+$", 0.95, "DECIMAL"),
    (DataType.DATE, r"^\d{2}-\d{2}-\d{4}$", 0.90, "DD-MM-YYYY"),
    (DataType.DATE, r"^\d{2}/\d{2}/\d{4}$", 0.90, "MM/DD/YYYY"),
    (DataType.DATE, r"^\d{4}-\d{2}-\d{2}$", 0.95, "ISO8601"),
    (DataType.DATE, r"^\d{8}$", 0.90, "YYYYMMDD"),
    (DataType.TIME, r"^\d{2}:\d{2}:\d{2}$", 0.90, "HH:MM:SS"),
    (DataType.DATETIME, r"^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$", 0.95, "ISO8601-DT"),
]

def _detect_deep_type(value: str) -> Optional[InferenceResult]:
    """Return InferenceResult if value looks like a typed literal."""
    v = value.strip()
    for dtype, pattern, conf, fmt in _DEEP_TYPE_PATTERNS:
        if re.fullmatch(pattern, v, re.I):
            return InferenceResult(dtype, fmt, conf, metadata={"detected_from_string": True})
    return None


# ---------------------------------------------------------------------------
#  Logging
# ---------------------------------------------------------------------------
def _logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.addHandler(logging.NullHandler())
    return logger




class RiskLevel(Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


# ---------------------------------------------------------------------------
#  Data models
# ---------------------------------------------------------------------------
@dataclass(slots=True)
class InferenceResult:
    data_type: DataType
    format_specifier: str
    confidence: float
    alternative_formats: List[Tuple[str, float]] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_confident(self, threshold: float = 0.7) -> bool:
        return self.confidence >= threshold

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "InferenceResult":
        return InferenceResult(**data)


@dataclass(slots=True)
class TransformationPlan:
    transformation_id: str
    source_inference: InferenceResult
    target_inference: InferenceResult
    required: bool
    strategy: str
    steps: List[str]
    validation_rules: List[str]
    reversible: bool = False
    risk_level: RiskLevel = RiskLevel.LOW

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> "TransformationPlan":
        data["source_inference"] = InferenceResult.from_dict(data["source_inference"])
        data["target_inference"] = InferenceResult.from_dict(data["target_inference"])
        data["risk_level"] = RiskLevel(data["risk_level"])
        return TransformationPlan(**data)


# ---------------------------------------------------------------------------
#  Inference rule plug-in system
# ---------------------------------------------------------------------------
class InferenceRule(ABC):
    priority: int = 0  # higher wins

    @abstractmethod
    def matches(self, field_name: str, value: str) -> bool:
        """Return True if this rule wants to handle the field."""

    @abstractmethod
    def infer(self, field_name: str, value: str) -> InferenceResult:
        """Return the inference result. MUST NOT raise."""


# ---------------------------------------------------------------------------
#  Concrete rules
# ---------------------------------------------------------------------------
class DateInferenceRule(InferenceRule):
    priority = 10

    PATTERNS: List[Tuple[str, List[str], str]] = [
        (r"^\d{6}$", [r"date", r"dt", r"_d$"], "YYMMDD"),
        (r"^\d{8}$", [r"date", r"dt", r"_d$"], "YYYYMMDD"),
        (r"^\d{4}-\d{2}-\d{2}$", [r"date", r"dt", r"iso"], "ISO8601"),
        (r"^\d{2}/\d{2}/\d{4}$", [r"date", r"dt"], "MM/DD/YYYY"),
        (r"^\d{2}-\d{2}-\d{4}$", [r"date", r"dt"], "MM-DD-YYYY"),
        (r"^\d{10}$", [r"timestamp", r"epoch", r"unix"], "EPOCH_SECONDS"),
        (r"^\d{4}\.\d{3}$", [r"julian", r"jdate"], "JULIAN"),
    ]

    def matches(self, field_name: str, value: str) -> bool:
        field_lower = field_name.lower()
        if not re.search(r"(date|dt|_d$|time|day)", field_lower):
            return False
        return any(re.match(p, value.strip()) for p, _, _ in self.PATTERNS)

    def infer(self, field_name: str, value: str) -> InferenceResult:
        field_lower, value_clean = field_name.lower(), value.strip()
        matches: List[Tuple[str, float]] = []
        for val_pattern, name_patterns, fmt_name in self.PATTERNS:
            if not re.match(val_pattern, value_clean):
                continue
            score = 0.6
            for np in name_patterns:
                if re.search(np, field_lower):
                    score = 0.9
                    break
            matches.append((fmt_name, score))
        if not matches:
            return InferenceResult(DataType.UNKNOWN, "", 0.0)
        matches.sort(key=lambda x: x[1], reverse=True)
        best, conf = matches[0]
        return InferenceResult(
            DataType.DATE,
            best,
            conf,
            alternative_formats=matches[1:],
            metadata={"raw": value_clean, "len": len(value_clean)},
        )


class NumericInferenceRule(InferenceRule):
    priority = 8

    def matches(self, field_name: str, value: str) -> bool:
        field_lower = field_name.lower()
        if not re.search(r"(qty|quantity|amount|price|cost|value|total|volume|weight|amt)", field_lower):
            return False
        cleaned = value.strip().replace(",", "").replace(" ", "")
        return bool(re.match(r"^-?\d+\.?\d*$", cleaned))

    def infer(self, field_name: str, value: str) -> InferenceResult:
        cleaned = value.strip().replace(",", "").replace(" ", "")
        if "." in cleaned:
            dp = len(cleaned.split(".")[1])
            fmt, conf, meta = f"DECIMAL_{dp}", 0.95, {}
        elif re.match(r"^\d{5,}$", cleaned):
            fmt, conf, meta = "IMPLIED_DECIMAL_2", 0.75, {"hint": "EDI implied 2 decimals"}
        elif re.match(r"^\d+$", cleaned):
            fmt, conf, meta = "INTEGER", 0.9, {}
        else:
            fmt, conf, meta = "UNKNOWN_NUMERIC", 0.5, {}
        return InferenceResult(DataType.NUMERIC, fmt, conf, metadata=meta)


class CodeInferenceRule(InferenceRule):
    priority = 7

    MAP = {
        "currency": (r"^[A-Z]{3}$", "ISO_CURRENCY_ALPHA"),
        "country": (r"^[A-Z]{2}$", "ISO_COUNTRY_ALPHA2"),
        "status": (r"^[A-Z]{1,2}$", "STATUS_CODE"),
    }

    def matches(self, field_name: str, value: str) -> bool:
        return bool(re.search(r"(code|id|status|currency|country|cd)", field_name.lower()))

    def infer(self, field_name: str, value: str) -> InferenceResult:
        field_lower, val_upper = field_name.lower(), value.strip().upper()
        for code_type, (pattern, fmt_name) in self.MAP.items():
            if code_type in field_lower and re.match(pattern, val_upper):
                return InferenceResult(DataType.CODE, fmt_name, 0.9, metadata={"code_type": code_type})
        if re.match(r"^[A-Z]{2,4}$", val_upper):
            fmt, conf = "ALPHA_CODE", 0.75
        elif re.match(r"^\d{2,4}$", val_upper):
            fmt, conf = "NUMERIC_CODE", 0.75
        elif re.match(r"^[A-Z0-9\-_]+$", val_upper):
            fmt, conf = "ALPHANUMERIC_CODE", 0.7
        else:
            fmt, conf = "MIXED_CODE", 0.6
        return InferenceResult(DataType.CODE, fmt, conf, metadata={"raw": value})


class StringInferenceRule(InferenceRule):
    priority = 1

    def matches(self, field_name: str, value: str) -> bool:
        return True

    def infer(self, field_name: str, value: str) -> InferenceResult:
        if re.search(r"(name|addr|address|desc|text|comment)", field_name.lower()):
            fmt, conf = "FREE_TEXT", 0.8
        else:
            fmt, conf = "GENERIC_STRING", 0.5
        return InferenceResult(DataType.STRING, fmt, conf, metadata={"len": len(value)})


# ---------------------------------------------------------------------------
#  Transformation strategy plug-in system
# ---------------------------------------------------------------------------
class TransformationStrategy(ABC):
    @abstractmethod
    def can_transform(self, source: InferenceResult, target: InferenceResult) -> bool:
        """Return True if this strategy can handle the conversion."""

    @abstractmethod
    def create_plan(
        self,
        source: InferenceResult,
        target: InferenceResult,
        risk_fn: Optional[Callable[[InferenceResult, InferenceResult], RiskLevel]] = None,
    ) -> TransformationPlan:
        """Return a plan (must not raise)."""

    @abstractmethod
    def execute(self, value: str, plan: TransformationPlan) -> str:
        """Execute the plan. May raise ValueError on invalid input."""

    def validate(self, value: str, plan: TransformationPlan) -> bool:
        """Optional post-execution validation. Return True if OK."""
        return True


# ---------------------------------------------------------------------------
#  Concrete strategies
# ---------------------------------------------------------------------------
class DateTransformationStrategy(TransformationStrategy):
    _PARSE = {
        "YYMMDD": "%y%m%d",
        "YYYYMMDD": "%Y%m%d",
        "ISO8601": "%Y-%m-%d",
        "MM/DD/YYYY": "%m/%d/%Y",
        "MM-DD-YYYY": "%m-%d-%Y",
    }
    _OUTPUT = {
        "YYMMDD": "%y%m%d",
        "YYYYMMDD": "%Y%m%d",
        "ISO8601": "%Y-%m-%d",
        "MM/DD/YYYY": "%m/%d/%Y",
        "MM-DD-YYYY": "%m-%d-%Y",
    }

    def can_transform(self, source: InferenceResult, target: InferenceResult) -> bool:
        return source.data_type == DataType.DATE and target.data_type == DataType.DATE

    def create_plan(
        self,
        source: InferenceResult,
        target: InferenceResult,
        risk_fn: Optional[Callable[[InferenceResult, InferenceResult], RiskLevel]] = None,
    ) -> TransformationPlan:
        required = source.format_specifier != target.format_specifier
        risk = (risk_fn or self._default_risk)(source, target)
        return TransformationPlan(
            transformation_id=f"DATE_{source.format_specifier}_TO_{target.format_specifier}",
            source_inference=source,
            target_inference=target,
            required=required,
            strategy="DateFormatConversion",
            steps=(
                [f"Parse {source.format_specifier}", f"Format to {target.format_specifier}"]
                if required
                else ["No transformation needed"]
            ),
            validation_rules=["Year in 1900-2100", "Month 1-12", "Day valid for month"],
            reversible=True,
            risk_level=risk,
        )

    def execute(self, value: str, plan: TransformationPlan) -> str:
        if not plan.required:
            return value
        src_fmt, tgt_fmt = plan.source_inference.format_specifier, plan.target_inference.format_specifier
        try:
            dt = datetime.strptime(value.strip(), self._PARSE[src_fmt])
            return dt.strftime(self._OUTPUT[tgt_fmt])
        except KeyError as e:
            raise ValueError(f"Unsupported date format: {e}") from None

    def _default_risk(self, _: InferenceResult, __: InferenceResult) -> RiskLevel:
        return RiskLevel.LOW


class NumericTransformationStrategy(TransformationStrategy):
    def can_transform(self, source: InferenceResult, target: InferenceResult) -> bool:
        return source.data_type == DataType.NUMERIC and target.data_type == DataType.NUMERIC

    def create_plan(
        self,
        source: InferenceResult,
        target: InferenceResult,
        risk_fn: Optional[Callable[[InferenceResult, InferenceResult], RiskLevel]] = None,
    ) -> TransformationPlan:
        required = source.format_specifier != target.format_specifier
        risk = (risk_fn or self._default_risk)(source, target)
        return TransformationPlan(
            transformation_id=f"NUMERIC_{source.format_specifier}_TO_{target.format_specifier}",
            source_inference=source,
            target_inference=target,
            required=required,
            strategy="NumericFormatConversion",
            steps=(
                [f"Parse {source.format_specifier}", "Apply decimal scaling", f"Format to {target.format_specifier}"]
                if required
                else ["No transformation needed"]
            ),
            validation_rules=["No overflow", "Precision preserved"],
            reversible=True,
            risk_level=risk,
        )

    def execute(self, value: str, plan: TransformationPlan) -> str:
        if not plan.required:
            return value
        src_fmt, tgt_fmt = plan.source_inference.format_specifier, plan.target_inference.format_specifier
        cleaned = value.strip().replace(",", "")
        # parse
        if src_fmt == "IMPLIED_DECIMAL_2":
            num = Decimal(cleaned) / 100
        elif src_fmt == "IMPLIED_DECIMAL_3":
            num = Decimal(cleaned) / 1000
        else:
            num = Decimal(cleaned)
        # format
        if tgt_fmt == "INTEGER":
            return str(int(num))
        if tgt_fmt.startswith("DECIMAL_"):
            dp = int(tgt_fmt.split("_")[1])
            return f"{num:.{dp}f}"
        if tgt_fmt == "IMPLIED_DECIMAL_2":
            return str(int(num * 100))
        return str(num)

    def _default_risk(self, src: InferenceResult, tgt: InferenceResult) -> RiskLevel:
        if "IMPLIED_DECIMAL" in (src.format_specifier, tgt.format_specifier):
            return RiskLevel.MEDIUM
        return RiskLevel.LOW


# ---------------------------------------------------------------------------
#  Engine
# ---------------------------------------------------------------------------
class SemanticTransformationEngine:
    """
    Thread-safe, extensible, cached semantic mapper.
    """

    def __init__(self, logger_name: str = "SemanticTransformationEngine"):
        self.logger = _logger(logger_name)
        self._rules: List[Type[InferenceRule]] = []
        self._strategies: List[Type[TransformationStrategy]] = []
        # register defaults
        for rule in (DateInferenceRule, NumericInferenceRule, CodeInferenceRule, StringInferenceRule):
            self.register_rule(rule)
        for strategy in (DateTransformationStrategy, NumericTransformationStrategy):
            self.register_strategy(strategy)

    # ---- plug-in API ----
    def register_rule(self, rule_class: Type[InferenceRule]) -> None:
        self._rules.append(rule_class)
        self._rules.sort(key=lambda r: r.priority, reverse=True)
        self.logger.info("Registered inference rule: %s", rule_class.__name__)

    def register_strategy(self, strategy_class: Type[TransformationStrategy]) -> None:
        self._strategies.append(strategy_class)
        self.logger.info("Registered transformation strategy: %s", strategy_class.__name__)

    # ---- public API ----
    @lru_cache(maxsize=2048)
    def infer_type(
        self,
        field_name: str,
        value: str,
        format_hint: Optional[str] = None,
    ) -> InferenceResult:
        """Thread-safe, cached inference."""
        if not value or not value.strip():
            return InferenceResult(DataType.UNKNOWN, "", 0.0, metadata={"error": "Empty value"})
        if format_hint:
            res = self._hint_to_inference(format_hint)
            if res:
                return res
        # 2. NEW: deep-type detector
        deep = _detect_deep_type(value)
        if deep:
            deep.metadata["source"] = "deep_string_scan"
            return deep
        for rule_cls in self._rules:
            rule = rule_cls()
            try:
                if rule.matches(field_name, value):
                    return rule.infer(field_name, value)
            except Exception as exc:
                self.logger.warning("Rule %s failed: %s", rule_cls.__name__, exc)
        return InferenceResult(DataType.UNKNOWN, "", 0.0)

    def analyze_mapping(
        self,
        source_field: str,
        source_value: str,
        target_field: str,
        target_value: str,
        source_format: Optional[str] = None,
        target_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        start = time.perf_counter_ns()
        src_inf = self.infer_type(source_field, source_value, source_format)
        tgt_inf = self.infer_type(target_field, target_value, target_format)
        plan = self._build_plan(src_inf, tgt_inf)
        warnings = self._collect_warnings(src_inf, tgt_inf, plan)
        duration = time.perf_counter_ns() - start
        return {
            "mapping": {
                "source_field": source_field,
                "source_value": source_value,
                "target_field": target_field,
                "target_value": target_value,
            },
            "source_inference": src_inf.to_dict(),
            "target_inference": tgt_inf.to_dict(),
            "compatibility": {
                "type_match": src_inf.data_type == tgt_inf.data_type,
                "format_match": src_inf.format_specifier == tgt_inf.format_specifier,
                "transformation_needed": plan.required if plan else src_inf.data_type != tgt_inf.data_type,
                "can_auto_transform": plan is not None,
            },
            "transformation_plan": plan.to_dict() if plan else None,
            "warnings": warnings,
            "duration_ns": duration,
        }

    def execute_transformation(
        self,
        source_field: str,
        source_value: str,
        target_field: str,
        target_value: str,
        source_format: Optional[str] = None,
        target_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        analysis = self.analyze_mapping(
            source_field, source_value,
            target_field, target_value,
            source_format, target_format,
        )
        if not analysis["compatibility"]["can_auto_transform"]:
            return {"success": False, "error": "No automatic transformation available", "analysis": analysis}
        if not analysis["compatibility"]["transformation_needed"]:
            return {"success": True, "original_value": source_value, "transformed_value": source_value}
        plan = TransformationPlan.from_dict(analysis["transformation_plan"])
        strategy = self._find_strategy(plan)
        if not strategy:
            return {"success": False, "error": "Strategy not found"}
        try:
            transformed = strategy.execute(source_value, plan)
            valid = strategy.validate(transformed, plan)
            if not valid:
                return {"success": False, "error": "Post-validation failed", "transformed_value": transformed}
            return {
                "success": True,
                "original_value": source_value,
                "transformed_value": transformed,
                "matches_target": transformed == target_value,
                "plan": plan.to_dict(),
            }
        except Exception as exc:
            self.logger.exception("Transformation execution failed")
            return {"success": False, "error": str(exc), "original_value": source_value}

    # ---- batch helpers ----
    def analyze_mappings(self, mappings: Sequence[Dict[str, Any]]) -> "pd.DataFrame":
        if pd is None:  # pragma: no cover
            raise RuntimeError("pandas required for batch mode")
        rows = [self.analyze_mapping(**m) for m in mappings]
        return pd.json_normalize(rows, sep="_")

    def execute_mappings(self, mappings: Sequence[Dict[str, Any]]) -> "pd.DataFrame":
        if pd is None:  # pragma: no cover
            raise RuntimeError("pandas required for batch mode")
        rows = [self.execute_transformation(**m) for m in mappings]
        return pd.DataFrame(rows)

    # ---- internal ----
    def _hint_to_inference(self, hint: str) -> Optional[InferenceResult]:
        hint_up = hint.upper()
        if any(k in hint_up for k in ("DATE", "TIME", "DT")):
            return InferenceResult(DataType.DATE, hint, 1.0, metadata={"source": "hint"})
        if any(k in hint_up for k in ("DECIMAL", "NUMERIC", "INTEGER", "IMPLIED")):
            return InferenceResult(DataType.NUMERIC, hint, 1.0, metadata={"source": "hint"})
        if any(k in hint_up for k in ("CODE", "ALPHA", "ISO")):
            return InferenceResult(DataType.CODE, hint, 1.0, metadata={"source": "hint"})
        return None

    def _build_plan(self, src: InferenceResult, tgt: InferenceResult) -> Optional[TransformationPlan]:
        if src.data_type != tgt.data_type:
            return None
        for strategy_cls in self._strategies:
            strategy = strategy_cls()
            if strategy.can_transform(src, tgt):
                return strategy.create_plan(src, tgt)
        return None

    def _find_strategy(self, plan: TransformationPlan) -> Optional[TransformationStrategy]:
        for strategy_cls in self._strategies:
            strategy = strategy_cls()
            if strategy.can_transform(plan.source_inference, plan.target_inference):
                return strategy
        return None

    def _collect_warnings(self, src: InferenceResult, tgt: InferenceResult, plan: Optional[TransformationPlan]) -> List[str]:
        w = []
        if src.data_type != tgt.data_type:
            w.append(f"Type mismatch: {src.data_type.value} -> {tgt.data_type.value}")
        if src.confidence < 0.7:
            w.append(f"Low source confidence {src.confidence:.2f}")
        if tgt.confidence < 0.7:
            w.append(f"Low target confidence {tgt.confidence:.2f}")
        if not plan and (src.data_type != tgt.data_type or src.format_specifier != tgt.format_specifier):
            w.append("No automatic transformation available")
        return w


# ---------------------------------------------------------------------------
#  Demo
# ---------------------------------------------------------------------------
def demo() -> None:
    engine = SemanticTransformationEngine()
    print("=" * 100)
    print("SEMANTIC TRANSFORMATION ENGINE – v2  DEMO")
    print("=" * 100)

    examples = [
        {
            "source_field": "containerCategory",
            "source_value": "FCL",
            "target_field": "containeCategory",
            "target_value": "FCL",
        },
        {
            "source_field": "Qty_Amount_Value",
            "source_value": "12345",
            "target_field": "MAITRI_Price",
            "target_value": "123.45",
        },
        {
            "source_field": "Address_Text",
            "source_value": "123 Main St",
            "target_field": "MAITRI_Ship_ADDR",
            "target_value": "123 Main St",
        },
        {
            "source_field": "Order_Amt",
            "source_value": "5000",
            "target_field": "Order_Total",
            "target_value": "50.00",
            "source_format": "IMPLIED_DECIMAL_2",
            "target_format": "DECIMAL_2",
        },
    ]

    for idx, ex in enumerate(examples, 1):
        print(f"\n[Example {idx}]")
        print("-" * 100)
        analysis = engine.analyze_mapping(**ex)
        # print("Source:", analysis["source_inference"]["format"], f"({analysis['source_inference']['confidence']})") if analysis["source_inference"]["format"] else "UNKNOWN",
        # print("Target:", analysis["target_inference"]["format"], f"({analysis['target_inference']['confidence']})") if analysis["target_inference"]["format"] else "UNKNOWN",
        print("Transformation needed:", analysis["compatibility"]["transformation_needed"])
        if analysis["transformation_plan"]:
            print("Strategy:", analysis["transformation_plan"]["strategy"])
            print("Risk:", analysis["transformation_plan"]["risk_level"])
        if analysis["warnings"]:
            print("Warnings:", ", ".join(analysis["warnings"]))
        # execute
        res = engine.execute_transformation(**ex)
        if res["success"]:
            print("Transformed:", res["transformed_value"], "matches target:", res.get("matches_target", False))
        else:
            print("Failed:", res["error"])
    print("\n" + "=" * 100)


if __name__ == "__main__":
    demo()