// Transformation.tsx
import { useEffect, useState } from "react";

type BackendItem = {
  analysis: {
    compatibility: {
      can_auto_transform: boolean;
      format_match: boolean;
      transformation_needed: boolean;
      type_match: boolean;
    };
    duration_ns: number;
    mapping: {
      source_field: string;
      source_value: string;
      target_field: string;
      target_value: string;
    };
    source_inference: {
      confidence: number;
      data_type: string;
      format_specifier: string;
      alternative_formats: string[];
      metadata?: any;
    };
    target_inference: {
      confidence: number;
      data_type: string;
      format_specifier: string;
      alternative_formats: string[];
      metadata?: any;
    };
    transformation_plan: any;
    warnings: string[];
  };
  error?: string;
  success: boolean;
};

export default function Transformation({ transData }: { transData: any[] }) {
  const [results, setResults] = useState<BackendItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!transData.length) return;
    const controller = new AbortController();
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("http://localhost:5000/api/transformation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mappings: transData }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setResults(json.results);
      } catch (e: any) {
        if (e.name !== "AbortError") setError(e.message || "Network error");
      } finally {
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [transData]);

  /* ---------- helpers ---------- */
  const copyToClipboard = () =>
    navigator.clipboard.writeText(
      results?.map((_, i) => transData[i]?.targetKey).join("\t") || ""
    );

  const downloadCSV = () => {
    const csv =
      "targetKey,sourceKey,original_value,transformed_value,success,error\n" +
      (results || [])
        .map((r, i) =>
          [
            `"${transData[i]?.targetKey ?? ""}"`,
            `"${transData[i]?.sourceKey ?? ""}"`,
            `"${r.analysis?.mapping?.source_value ?? ""}"`,
            `"${r.analysis?.mapping?.target_value ?? ""}"`,
            `"${r.success}"`,
            `"${r.error ?? ""}"`,
          ].join(",")
        )
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), {
      href: url,
      download: "transformation_report.csv",
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ---------- render ---------- */
  if (!transData.length)
    return <p className="text-gray-500">No mappings to transform.</p>;

  if (loading)
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></span>
        Transforming…
      </div>
    );

  if (error) return <p className="text-red-600">Error: {error}</p>;
  if (!results) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 overflow-y-auto">
      {/* header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">
          Transformation Report
        </h2>
        <div className="flex gap-2">
          <button
            onClick={copyToClipboard}
            className="px-3 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-sm"
          >
            Copy target keys
          </button>
          <button
            onClick={downloadCSV}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((item, idx) => (
          <Card key={idx} item={item} mapping={transData[idx]} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* --------------------------  sub-components  ---------------------- */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* --------------------------  Card  -------------------------------- */
/* ------------------------------------------------------------------ */
function Card({ item, mapping }: { item: BackendItem; mapping: any }) {
  const { analysis, success } = item;
  const durationMs = (analysis?.duration_ns || 0) / 1_000_000;

  const shortType = (t: string) => t.replace("DataType.", "");

  /* decide badge colour & text */
  const needsTransform = analysis.compatibility.transformation_needed;
  const badgeText = needsTransform ? "Transformation needed" : "No transformation needed";
  const badgeColor = needsTransform
    ? "bg-amber-100 text-amber-800"
    : "bg-green-100 text-green-800";

  /* filter only active compatibility chips */
  const activeChips = [
    { key: "type_match", label: "Type match" },
    { key: "format_match", label: "Format match" },
    { key: "transformation_needed", label: "Transform needed" },
    { key: "can_auto_transform", label: "Can auto-transform" },
  ].filter((c) => analysis.compatibility[c.key as keyof typeof analysis.compatibility]);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      {/* ---------- header bar ---------- */}
      <div
        className={`px-4 py-3 flex items-center justify-between ${badgeColor}`}
      >
        {/* left : transformation badge */}
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeColor}`}
        >
          {/* {badgeText} */}
        </span>

        {/* right : duration */}
        {/* <span className="text-xs text-gray-500">{durationMs.toFixed(2)} ms</span> */}
      </div>

      {/* ---------- body ---------- */}
      <div className="p-5 space-y-4">
        {/* ----- target / source keys row ----- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* target side */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Target key
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-800 break-all">
              {mapping.targetKey}
            </div>
            <div className="mt-2 text-sm text-gray-700 break-all">
              <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700">
                {analysis.mapping.target_value}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {shortType(analysis.target_inference.data_type)}
            </div>
          </div>

          {/* source side */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Source key
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-800 break-all">
              {mapping.sourceKey}
            </div>
            <div className="mt-2 text-sm text-gray-700 break-all">
              <span className="inline-block px-2 py-1 rounded bg-gray-100 text-gray-700">
                {analysis.mapping.source_value}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {shortType(analysis.source_inference.data_type)}
            </div>
          </div>
        </div>

        {/* ----- compatibility + confidence row ----- */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* left : compatibility chips (only active) */}
          <div className="flex-1">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Compatibility
            </div>
            <div className="flex flex-wrap gap-2">
              {activeChips.map((c) => (
                <Chip key={c.key} active label={c.label} />
              ))}
            </div>
          </div>

          {/* right : confidence score with hover warnings */}
          <div className="sm:text-right">
            <ConfidenceWithWarnings
              confidence={analysis.source_inference.confidence}
              warnings={analysis.warnings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ---------------  Confidence + warnings on hover  ----------------- */
/* ------------------------------------------------------------------ */
function ConfidenceWithWarnings({
  confidence,
  warnings,
}: {
  confidence: number;
  warnings: string[];
}) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* confidence bar */}
      <div className="w-40">
     
        
      </div>

      {/* hover warnings */}
      {show && warnings.length > 0 && (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-xs text-amber-700 z-10">
          <div className="font-semibold mb-1">Warnings</div>
          <ul className="list-disc pl-5 space-y-1">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* -------------------- tiny reusable bits -------------------- */
const Chip = ({ label, active }: { label: string; active?: boolean }) => (
  <span
    className={`px-2.5 py-1 rounded-full text-xs border ${
      active
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : "bg-gray-50 text-gray-500 border-gray-200"
    }`}
  >
    {label}
  </span>
);