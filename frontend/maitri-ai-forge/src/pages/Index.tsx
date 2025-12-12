/* Index.tsx – cleaned & minimal */
import { useState, useEffect } from 'react';
import { UploadSection, UploadSectionData } from '@/components/UploadSection';
import { MappingResultsModal } from '@/components/MappingResultsModal';
import LoadingAnimation from '@/components/LoadingAnimation';
import { PastMappings, SavedMapping } from '@/components/PastMappings';
import { PastMappingView } from '@/components/PastMappingView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, History, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  saveMappingToBackend,
  getMappingsFromBackend,
  updateMappingInBackend,
  deleteMappingFromBackend,
} from '@/lib/mappingStorage';
import { get } from 'http';
import { Download } from 'lucide-react';
function downloadPublicFile(fileName: string, mime: string) {
  const link = document.createElement('a');
  link.href = `/${fileName}`;          // public folder root
  link.download = fileName;            // keeps original name
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
const Index = () => {
  /* ---------- state we really need ---------- */
  const [leftData, setLeftData] = useState<UploadSectionData>({
    files: [],
    domain: null,
    country: null,
    portStation: null,
    messageNames: {},
  });
  const [rightData, setRightData] = useState<UploadSectionData>({
    files: [],
    domain: null,
    country: null,
    portStation: null,
    messageNames: {},
  });

  const [showLeftErrors, setShowLeftErrors] = useState(false);
  const [showRightErrors, setShowRightErrors] = useState(false);
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mappingResults, setMappingResults] = useState<any>(null);

  const [pastMappings, setPastMappings] = useState<SavedMapping[]>([]);
  const [selectedPastMapping, setSelectedPastMapping] =
    useState<SavedMapping | null>(null);
  const [isViewingPastMapping, setIsViewingPastMapping] = useState(false);

  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  /* duplicate-warning state */
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMapping, setDuplicateMapping] =
    useState<SavedMapping | null>(null);

  /* ---------- derived booleans ---------- */
  const isLeftComplete =
    leftData.files.length > 0 &&
    leftData.domain &&
    leftData.country &&
    leftData.portStation;
  const isRightComplete =
    rightData.files.length > 0 &&
    rightData.domain &&
    rightData.country &&
    rightData.portStation;
  const canShowAIButton = isLeftComplete && isRightComplete;

  /* ---------- side effects ---------- */
  const loadMappings = async () => {
    try {
      const mappings = await getMappingsFromBackend();
      setPastMappings(mappings);
     
    } catch {
      toast.error('Could not load past mappings');
    }
  };

  useEffect(() => {
    loadMappings();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') loadMappings();
  }, [activeTab]);

  /* ---------- handlers ---------- */
  const handleApprove = (approvedMappings: Array<{ targetKey: string; sourceKey: string }>) => {
    const newMapping: SavedMapping = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      sourceCountry: leftData.country!,
      sourceDomain: leftData.domain!,
      sourceSystem: leftData.portStation!,
      targetCountry: rightData.country!,
      targetDomain: rightData.domain!,
      targetSystem: rightData.portStation!,
      mappingCount: approvedMappings.length,
      approvedMappings,
    };

    saveMappingToBackend(newMapping);
    loadMappings();
    toast.success('Mapping saved successfully!');
  };
  const getMappingsById =(mappingsg, id) =>{
    const entry = mappingsg.find(item => item.id === id);
    console.log('getMappingsById entry:', entry.approvedMappings);
    return entry.approvedMappings;
  }
  const handleViewPastMapping = (mapping: SavedMapping) => {
    setSelectedPastMapping(mapping);
    setIsViewingPastMapping(true);
  };

  const handleSavePastMappingEdit = (mappings: any) => {
    if (!selectedPastMapping) return;
    updateMappingInBackend(selectedPastMapping.id, mappings);
    console.log('Saved edited mappings');
    loadMappings();

    // setSelectedPastMapping(mapping);
    toast.success('Mapping updated!');
 
    
  };

  const handleAIAnalysis = async (force = false) => {
    if (!isLeftComplete) {
      setShowLeftErrors(true);
      toast.error('Please complete all fields in the source section');
      return;
    }
    if (!isRightComplete) {
      setShowRightErrors(true);
      toast.error('Please complete all fields in the target section');
      return;
    }

    /* duplicate check */
    const existing = pastMappings.find(
      (m) =>
        m.sourceCountry === leftData.country &&
        m.sourceDomain === leftData.domain &&
        m.sourceSystem === leftData.portStation &&
        m.targetCountry === rightData.country &&
        m.targetDomain === rightData.domain &&
        m.targetSystem === rightData.portStation
    );

    if (existing && !force) {
      setDuplicateMapping(existing);
      setShowDuplicateWarning(true);
      return;
    }

    /* ---------- real AI call ---------- */
    setIsLoading(true);
    try {
      const formData = new FormData();
      leftData.files.forEach((f) => formData.append('files', f));
      rightData.files.forEach((f) => formData.append('files', f));

      const metadata: Record<string, any> = {};
      [...leftData.files, ...rightData.files].forEach((file) => {
        const side = leftData.files.includes(file) ? 'source' : 'target';
        const data = side === 'source' ? leftData : rightData;
        metadata[file.name] = {
          type: side,
          message_name: data.messageNames[file.name],
          country: data.country,
          domain: data.domain,
          system: data.portStation,
        };
      });
      formData.append('metadata', JSON.stringify(metadata));

      const res = await fetch('http://127.0.0.1:5000/api/map_files', {
        method: 'POST',
        body: formData,
      });

      

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Mapping failed');
      }

      const json = await res.json();
      console.log('Mapping results:', json);
      setMappingResults(json);
      setIsResultsModalOpen(true);
      toast.success('Mapping completed successfully!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to map files');
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* LEFT: logo + title */}
            <div className="flex items-center gap-3">
              <img src="/logo.jpg" alt="Logo" className="h-12 w-12" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                  MAITRI AI
                </h1>
                <p className="text-sm text-muted-foreground">Bridging Borders with Seamless Trade</p>
              </div>
            </div>

            {/* RIGHT: download dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download Input Formats
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => downloadPublicFile('csv_data.csv', 'text/csv')}>
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPublicFile('xlsx_data.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')}>
                  XLSX
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPublicFile('xml_data.xml', 'application/xml')}>
                  XML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => downloadPublicFile('json_data.json', 'application/json')}>
                  JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" /> New Mapping
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" /> Past Mappings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6 relative">
              <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                
                <UploadSection
                  title="Destination"
                  data={rightData}
                  onChange={setRightData}
                  showErrors={showRightErrors}
                />
              </div>

              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -ml-px">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
              </div>

              <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                <UploadSection
                  title="Origin"
                  data={leftData}
                  onChange={setLeftData}
                  showErrors={showLeftErrors}
                />
              </div>
            </div>

            <div className="flex justify-center mt-8">
              <Button
                size="lg"
                onClick={() => handleAIAnalysis()}
                disabled={!canShowAIButton || isLoading}
                className="relative group bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <span>MAITRI AI</span>
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-6 h-6 animate-pulse" />
                      <span>MAITRI AI</span>
                      <Sparkles className="w-6 h-6 animate-pulse" />
                    </>
                  )}
                </div>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <PastMappings
              mappings={pastMappings}
              onViewMapping={handleViewPastMapping}
              onDeleteMapping={deleteMappingFromBackend}
              refresh={loadMappings}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* ---------- modals ---------- */}
      {isLoading && <LoadingAnimation leftFiles={leftData.files} rightFiles={rightData.files} />}

      {mappingResults && (
        <MappingResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => setIsResultsModalOpen(false)}
          results={mappingResults}
          onApprove={handleApprove}
        />
      )}

      {selectedPastMapping && (
        <PastMappingView
          isOpen={isViewingPastMapping}
          onClose={() => setIsViewingPastMapping(false)}
          mappings={selectedPastMapping.approvedMappings}
          onSave={handleSavePastMappingEdit}
        />
      )}

      {/* duplicate-warning dialog */}
      <Dialog open={showDuplicateWarning} onOpenChange={(o) => !o && setShowDuplicateWarning(false)}>
        <DialogContent className="max-w-lg p-6">
          <DialogTitle className="text-xl font-bold text-red-600">Duplicate Mapping Detected</DialogTitle>
          <p className="my-4 text-gray-700">A mapping with this Origin/Destination combination already exists.</p>

          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <p>
              <strong>Origin:</strong> {duplicateMapping?.sourceCountry} / {duplicateMapping?.sourceDomain} /{' '}
              {duplicateMapping?.sourceSystem}
            </p>
            <p>
              <strong>Destination:</strong> {duplicateMapping?.targetCountry} / {duplicateMapping?.targetDomain} /{' '}
              {duplicateMapping?.targetSystem}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setShowDuplicateWarning(false);
                handleAIAnalysis(true); // force
              }}
            >
              Ignore and Proceed
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowDuplicateWarning(false);
                setSelectedPastMapping(duplicateMapping);
                setIsViewingPastMapping(true);
              }}
            >
              View Mapping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;