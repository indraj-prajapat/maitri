import { useState, useEffect } from 'react';
import { UploadSection, UploadSectionData } from '@/components/UploadSection';
import { MappingResultsModal } from '@/components/MappingResultsModal';
import LoadingAnimation  from '@/components/LoadingAnimation';
import { PastMappingsView, SavedMapping } from '@/components/PastMappingsView';
import { ApprovedMappingView } from '@/components/ApprovedMappingView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles, History, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { saveMappingToBackend, getMappingsFromBackend, updateMappingInBackend, deleteMappingFromBackend } from '@/lib/mappingStorage';

const Index = () => {
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
  const [selectedPastMapping, setSelectedPastMapping] = useState<SavedMapping | null>(null);
  const [isViewingPastMapping, setIsViewingPastMapping] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [duplicateMapping, setDuplicateMapping] = useState<SavedMapping | null>(null);
  const [proceedAfterWarning, setProceedAfterWarning] = useState(false);
  const [isViewingDuplicateMapping, setIsViewingDuplicateMapping] = useState(false);

  const isLeftComplete = 
    leftData.files.length > 0 &&
    leftData.domain !== null &&
    leftData.country !== null &&
    leftData.portStation !== null;

  const isRightComplete =
    rightData.files.length > 0 &&
    rightData.domain !== null &&
    rightData.country !== null &&
    rightData.portStation !== null;

  const canShowAIButton = isLeftComplete && isRightComplete;
  const loadMappings = async () => {
    try {
      const mappings = await getMappingsFromBackend();
      setPastMappings(mappings);
    } catch (error) {
      console.error('Failed to load mappings:', error);
      // Optionally set an error state here
    }
  };
  useEffect(() => {
    loadMappings();
  }, []);

  const handleApprove = (approvedMappings: Array<{ targetKey: string; sourceKey: string }>) => {
    const newMapping: SavedMapping = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      sourceCountry: leftData.country || '',
      sourceDomain: leftData.domain || '',
      sourceSystem: leftData.portStation || '',
      targetCountry: rightData.country || '',
      targetDomain: rightData.domain || '',
      targetSystem: rightData.portStation || '',
      mappingCount: approvedMappings.length,
      approvedMappings,
    };
    
    saveMappingToBackend(newMapping);
    loadMappings();
    toast.success('Mapping saved successfully!');
  };

  const handleViewPastMapping = (mapping: SavedMapping) => {
    loadMappings();
    setSelectedPastMapping(mapping);
    setIsViewingPastMapping(true);
    
  };



  const handleSavePastMappingEdit = (mappings: Array<{ targetKey: string; sourceKey: string }>) => {
    if (selectedPastMapping) {
      const updated = {
        ...selectedPastMapping,
        approvedMappings: mappings,
      };
      updateMappingInBackend(selectedPastMapping.id, updated);
      setSelectedPastMapping(updated);
      loadMappings();
      toast.success('Mapping updated!');
    }
  };

  const handleAIAnalysis = async () => {
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

    const existingMapping = pastMappings.find(mapping =>
      mapping.sourceCountry === leftData.country &&
      mapping.sourceDomain === leftData.domain &&
      mapping.sourceSystem === leftData.portStation &&
      mapping.targetCountry === rightData.country &&
      mapping.targetDomain === rightData.domain &&
      mapping.targetSystem === rightData.portStation
    );

    if (existingMapping && !proceedAfterWarning) {
      setDuplicateMapping(existingMapping);
      setShowDuplicateWarning(true);
      return; // wait for user action
    }

    // Reset flags and proceed with AI analysis
    setProceedAfterWarning(false);
    setShowDuplicateWarning(false);
    setDuplicateMapping(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      leftData.files.forEach(file => formData.append('files', file));
      rightData.files.forEach(file => formData.append('files', file));
      const metadata: Record<string, any> = {};
      leftData.files.forEach(file => {
        metadata[file.name] = {
          type: 'source',
          message_name: leftData.messageNames[file.name],
          country: leftData.country,
          domain: leftData.domain,
          system: leftData.portStation,
        };
      });
      rightData.files.forEach(file => {
        metadata[file.name] = {
          type: 'target',
          message_name: rightData.messageNames[file.name],
          country: rightData.country,
          domain: rightData.domain,
          system: rightData.portStation,
        };
      });
      formData.append('metadata', JSON.stringify(metadata));

      const response = await fetch('http://127.0.0.1:5000/api/map_files', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Mapping failed');
      }

      const results = await response.json();
      setMappingResults(results);
      console.log('Mapping results:', results);
      setIsResultsModalOpen(true);
      toast.success('Mapping completed successfully!');
    } catch (error) {
      console.error('Mapping error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to map files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      loadMappings();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg">
              <img 
                src="/logo.jpg" 
                alt="Logo" 
                className='h-12 w-12 yexy-white'
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                MAITRI AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Bridging Borders with Seamless Trade

              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              New Mapping
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              Past Mappings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-6 relative">
              {/* Left Section */}
              <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                <UploadSection
                  title="Destination"
                  data={rightData}
                  onChange={setRightData}
                  showErrors={showRightErrors}
                />
              </div>

              {/* Vertical Divider - Hidden on mobile */}
              <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 -ml-px">
                <div className="w-px h-full bg-gradient-to-b from-transparent via-border to-transparent" />
              </div>

              {/* Right Section */}
              <div className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
                
                <UploadSection
                  title="Origin"
                  data={leftData}
                  onChange={setLeftData}
                  showErrors={showLeftErrors}
                />
              </div>
            </div>

            {/* AI Analysis Button - Always visible */}
            <div className="flex justify-center mt-8 animate-fade-in">
              <Button
                size="lg"
                onClick={handleAIAnalysis}
                disabled={!canShowAIButton || isLoading}
                className="relative group bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl px-8 py-6 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
                <div className="relative flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <Sparkles className="w-6 h-6 animate-pulse " />
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

          <TabsContent value="history" onClick={()=>loadMappings()}>
            <PastMappingsView
              mappings={pastMappings}
              onViewMapping={handleViewPastMapping}
              onDeleteMapping={deleteMappingFromBackend}
              refresh={loadMappings}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Loading Animation Modal */}
      
      {isLoading &&(
        <LoadingAnimation leftFiles={leftData.files} rightFiles={rightData.files} />
      )}

      {/* Mapping Results Modal */}
      {mappingResults && (
        <MappingResultsModal
          isOpen={isResultsModalOpen}
          onClose={() => setIsResultsModalOpen(false)}
          results={mappingResults}
          onApprove={handleApprove}
        />
      )}

      {/* Past Mapping View Modal */}
      {selectedPastMapping && (
        <ApprovedMappingView
          isOpen={isViewingPastMapping}
          onClose={() => setIsViewingPastMapping(false)}
          mappings={selectedPastMapping.approvedMappings}
          onSave={handleSavePastMappingEdit}
        />
      )}
      {showDuplicateWarning && duplicateMapping && (
      <Dialog open={showDuplicateWarning} onOpenChange={() => setShowDuplicateWarning(false)}>
        <DialogContent className="max-w-lg max-h-[70vh] overflow-auto p-6">
          <h3 className="text-xl font-semibold mb-6 text-center text-red-600">Duplicate Mapping Detected</h3>
          
          <p className="mb-6 text-center text-gray-700">
            A mapping with this Origin and Destination combination already exists.
          </p>
          
          <div className="mb-6 p-4 border rounded-lg bg-gray-50 max-h-[40vh] overflow-y-auto">
            <h4 className="font-semibold mb-3 text-gray-900 border-b border-gray-300 pb-2">Matching Mapping Details:</h4>
            
            <p className="mb-2">
              <strong>Origin:</strong> {duplicateMapping.sourceCountry} / {duplicateMapping.sourceDomain} / {duplicateMapping.sourceSystem}
            </p>
            <p className="mb-4">
              <strong>Destination:</strong> {duplicateMapping.targetCountry} / {duplicateMapping.targetDomain} / {duplicateMapping.targetSystem}
            </p>

           
          </div>
          
          <p className="mb-6 text-center text-gray-600 font-semibold">What would you like to do?</p>
          
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDuplicateWarning(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setProceedAfterWarning(true);
                setShowDuplicateWarning(false);
                handleAIAnalysis();
              }}
            >
              Ignore and Proceed
            </Button>
            <Button variant="secondary" onClick={() => {
              
              setIsViewingDuplicateMapping(true);
            }}>
              View Mapping
            </Button>
          </div>
        </DialogContent>

      </Dialog>
    )}
    {duplicateMapping && (
      <ApprovedMappingView
        isOpen={isViewingDuplicateMapping}
        onClose={() => setIsViewingDuplicateMapping(false)}
        mappings={duplicateMapping.approvedMappings}
        onSave={() => {}}
      />
    )}


    </div>
  );
};

export default Index;
