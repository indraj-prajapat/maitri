import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Filter, Search, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_ROOT } from "@/lib/apiConfig";

export interface TransformationResult {
  source_key: string;
  source_key_tag: string;
  source_value: string;
  source_value_tag: string;
  source_format: string;
  
  target_key: string;
  target_key_tag: string;
  target_value: string;
  target_value_tag: string;
  target_format: string;
  
  transformation_needed: string;
  transformation_type: string;
  transformation_reason: string;
  transformed_value: string;
}

interface TransformationResultsProps {
  transData: any[]; // Input data to send to backend
  apiUrl?: string; // API endpoint URL, defaults to localhost:5000
}

export default function TransformationResults({ 
  transData, 
  apiUrl = API_ROOT 
}: TransformationResultsProps) {
  const [results, setResults] = useState<TransformationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "needs_transformation" | "no_transformation">("all");

  // Fetch transformation results from backend
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const res = await fetch(`${apiUrl}/api/transformation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mappings: transData }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || `HTTP ${res.status}`);
        }

        const json = await res.json();
        console.log("transformation response", json.results);
        
        // Sort results: transformation needed first
        const sortedResults = (json.results || []).sort((a: TransformationResult, b: TransformationResult) => {
          const aNeeds = a.transformation_needed !== "No" ? 0 : 1;
          const bNeeds = b.transformation_needed !== "No" ? 0 : 1;
          return aNeeds - bNeeds;
        });

        setResults(sortedResults);
      } catch (err) {
        if (err instanceof Error) {
          if (err.name === "AbortError") {
            setError("Request timeout. Please try again.");
          } else {
            setError(err.message || "Failed to fetch transformation results");
          }
        } else {
          setError("An unexpected error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    if (transData && transData.length > 0) {
      fetchResults();
    }
  }, [transData, apiUrl]);

  // Filter results based on search and filter mode
  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.source_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.target_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.source_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.target_value.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterMode === "needs_transformation") {
      return matchesSearch && result.transformation_needed !== "No";
    } else if (filterMode === "no_transformation") {
      return matchesSearch && result.transformation_needed === "No";
    }

    return matchesSearch;
  });

  // Statistics
  const stats = {
    total: results.length,
    needsTransformation: results.filter((r) => r.transformation_needed !== "No").length,
    noTransformation: results.filter((r) => r.transformation_needed === "No").length,
  };

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>No Results</CardTitle>
            <CardDescription>
              No transformation data available. Please provide input data to analyze.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 overflow-y-auto">
      {/* Header with Statistics */}
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transformation Analysis Results</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and manage data field transformations
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Needs Transformation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">{stats.needsTransformation}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-900">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                No Transformation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.noTransformation}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by key or value..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filterMode === "all" ? "default" : "outline"}
            onClick={() => setFilterMode("all")}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            All ({stats.total})
          </Button>
          <Button
            variant={filterMode === "needs_transformation" ? "default" : "outline"}
            onClick={() => setFilterMode("needs_transformation")}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Needs ({stats.needsTransformation})
          </Button>
          <Button
            variant={filterMode === "no_transformation" ? "default" : "outline"}
            onClick={() => setFilterMode("no_transformation")}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            No ({stats.noTransformation})
          </Button>
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              No results match your search or filter criteria.
            </CardContent>
          </Card>
        ) : (
          filteredResults.map((result, idx) => (
            <TransformationCard key={idx} result={result} />
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Individual transformation result card
 */
function TransformationCard({ result }: { result: TransformationResult }) {
  // If target value is null/empty, no transformation is needed
  const targetIsEmpty = result.target_value === "" || result.target_value === null || result.target_value_tag === "null";
  const needsTransformation = result.transformation_needed !== "No" ;

  return (
    <Card
      className={`overflow-hidden transition-all ${
        needsTransformation
          ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800"
          : "border-border"
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">
                <span className="font-semibold text-primary">{result.target_key}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <span className="font-semibold text-primary">{result.source_key}</span>
              </CardTitle>
              {needsTransformation && (
                <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Transformation Required
                </Badge>
              )}
              {!needsTransformation && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  No Change
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              {result.transformation_reason}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Target and Source Comparison - Target on Left, Source on Right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Side (Left) */}
          <div className="space-y-3 p-4 bg-background/50 rounded-lg border border-border/50">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Target
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Key Tag</p>
                  <Badge variant="outline" className="mt-1">
                    {result.target_key_tag}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value</p>
                  <p className="font-mono text-sm bg-background p-2 rounded border border-border/50 mt-1 break-all">
                    {result.target_value}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type & Format</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {result.target_value_tag}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {result.target_format}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Source Side (Right) */}
          <div className="space-y-3 p-4 bg-background/50 rounded-lg border border-border/50">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Source
              </p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Key Tag</p>
                  <Badge variant="outline" className="mt-1">
                    {result.source_key_tag}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Value</p>
                  <p className="font-mono text-sm bg-background p-2 rounded border border-border/50 mt-1 break-all">
                    {result.source_value}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type & Format</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {result.source_value_tag}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {result.source_format}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
