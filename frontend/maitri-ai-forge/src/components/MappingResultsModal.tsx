import { useState ,useEffect} from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Info, Edit, Eye, ArrowLeft, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface MappingResult {
  [targetMessage: string]: {
    [targetKey: string]: {
      key1?: KeyInfo;
      key2?: KeyInfo;
      key3?: KeyInfo;
    };
  };
}

interface KeyInfo {
  final_score: number;
  source_message: string;
  source_key: string;
  source_file: string;
  source_country: string;
  source_domain: string;
  source_system: string;
}

interface MappingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MappingResult;
  onApprove?: (approvedMappings: Array<{ targetKey: string; sourceKey: string }>) => void;
  scoreThreshold?: number;
}

export const MappingResultsModal = ({ isOpen, onClose, results, onApprove, scoreThreshold = 0.4 }: MappingResultsModalProps) => {
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string | null>>({});
  const [isApproved, setIsApproved] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [currentThreshold, setCurrentThreshold] = useState(scoreThreshold);
  const [lowThreshold, setLowThreshold] = useState(0.4);
  const [highThreshold, setHighThreshold] = useState(0.8);

  // Initialize selected keys with key1 as default based on current threshold
  useEffect(() => {
    if (isOpen && Object.keys(results).length > 0) {
      const selections: Record<string, string | null> = {};

      Object.entries(results).forEach(([targetMessage, mappings]) => {
        Object.entries(mappings).forEach(([targetKey, keySet]) => {
          const key1Info = keySet?.key1;
          const shouldSelectKey1 = key1Info && key1Info.final_score >= currentThreshold;

          const uniqueKey = `${targetMessage}::${targetKey}`;
          selections[uniqueKey] = shouldSelectKey1 ? "key1" : null;
        });
      });

      setSelectedKeys(selections);
    }
  }, [isOpen, results, currentThreshold]);


  // Get all available keys for a target
  const getAllKeysForTarget = (targetMessage: string, targetKey: string) => {
    const mappings = results[targetMessage]?.[targetKey];
    if (!mappings) return [];

    // Dynamically collect all key-* properties
    const allKeys = Object.entries(mappings)
      .filter(([key]) => key.startsWith("key"))
      .map(([keyNum, info]) => ({ keyNum, info }));

    return allKeys;
  };


  // Get color based on score with user-defined thresholds
  const getScoreColor = (score: number) => {
    if (score >= highThreshold) return 'text-green-500';
    if (score >= lowThreshold) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getScoreBgColor = (score: number) => {
    if (score >= highThreshold) return 'bg-green-50';
    if (score >= lowThreshold) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const handleKeySelect = (targetMessage: string, targetKey: string, keyNum: string | null) => {
    const key = `${targetMessage}::${targetKey}`;
    const currentSelection = selectedKeys[key];
    
    // If clicking the same key, deselect it
    if (currentSelection === keyNum) {
      setSelectedKeys({
        ...selectedKeys,
        [key]: null
      });
    } else {
      setSelectedKeys({
        ...selectedKeys,
        [key]: keyNum
      });
    }
    setHasEdited(true);
  };

  const handleDropdownSelect = (targetMessage: string, targetKey: string, keyNum: string) => {
    const key = `${targetMessage}::${targetKey}`;
    setSelectedKeys({
      ...selectedKeys,
      [key]: keyNum
    });
    setHasEdited(true);
  };

  const handleApprove = () => {
    const approvedMappings: Array<{ targetKey: string; sourceKey: string }> = [];
    
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key];
        
        if (selectedKeyNum) {
          const selectedKeyInfo = keys[selectedKeyNum as keyof typeof keys];
          
          if (selectedKeyInfo) {
            approvedMappings.push({
              targetKey: `${targetMessage}::${targetKey}`,
              sourceKey: `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
            });
          }
        }
      });
    });
    setIsPreviewMode(false)
    setIsApproved(true);
    onApprove?.(approvedMappings);
  };

  const handleDownloadCSV = () => {
    const csvRows: string[] = ['Target Key,Source Key'];
    
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key];
        
        if (selectedKeyNum) {
          const selectedKeyInfo = keys[selectedKeyNum as keyof typeof keys];
          
          if (selectedKeyInfo) {
            csvRows.push([
              `${targetMessage}::${targetKey}`,
              `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
            ].join(','));
          }
        }
      });
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'approved_mapping.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderSelectedCell = (targetMessage: string, targetKey: string) => {
    const key = `${targetMessage}::${targetKey}`;
    const selectedKeyNum = selectedKeys[key];
    
    if (!selectedKeyNum) {
      return (
        <td className="px-4 py-3 border-r border-border/50 bg-muted/20">
          <div className="text-center text-muted-foreground text-sm italic">None selected</div>
        </td>
      );
    }

    const mappings = results[targetMessage]?.[targetKey];
    const keyInfo = mappings?.[selectedKeyNum as keyof typeof mappings];

    if (!keyInfo) {
      return (
        <td className="px-4 py-3 border-r border-border/50 bg-muted/20">
          <div className="text-center text-muted-foreground text-sm italic">None selected</div>
        </td>
      );
    }

    return (
      <td className="px-4 py-3 border-r border-border/50 bg-gradient-to-r from-green-50 to-blue-50">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2">
                <CheckCircle className={cn("w-4 h-4", getScoreColor(keyInfo.final_score))} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{keyInfo.source_key}</div>
                  <div className="text-xs text-muted-foreground truncate">{keyInfo.source_message}</div>
                </div>
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-card border-2 border-primary/20">
              <div className="space-y-2 text-xs">
                <div className="font-bold text-primary border-b border-primary/20 pb-1">Selected Mapping</div>
                <p><strong>Score:</strong> <span className={getScoreColor(keyInfo.final_score)}>{keyInfo.final_score.toFixed(3)}</span></p>
                <p><strong>Source Key:</strong> {keyInfo.source_key}</p>
                <p><strong>Message:</strong> {keyInfo.source_message}</p>
                <p><strong>File:</strong> {keyInfo.source_file}</p>
                <p><strong>Country:</strong> {keyInfo.source_country}</p>
                <p><strong>Domain:</strong> {keyInfo.source_domain}</p>
                <p><strong>System:</strong> {keyInfo.source_system}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
    );
  };

  const renderKeyCell = (
    targetMessage: string,
    targetKey: string,
    keyNum: string,
    keyInfo?: KeyInfo
  ) => {
    const key = `${targetMessage}::${targetKey}`;
    const isSelected = selectedKeys[key] === keyNum;

    if (!keyInfo) {
      return (
        <td className="px-4 py-3 border-r border-border/50 bg-muted/10 text-center text-sm text-muted-foreground">
          -
        </td>
      );
    }

    return (
      <td
        className={cn(
          "px-4 py-3 border-r border-border/50 cursor-pointer transition-all",
          isSelected
            ? "bg-blue-100 ring-2 ring-primary/40 shadow-sm"
            : "hover:bg-muted/20 bg-white text-gray-500"
        )}
        onClick={() => handleKeySelect(targetMessage, targetKey, keyNum)}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="font-semibold text-sm truncate">{keyInfo.source_key}</span>
                  <span className="text-xs text-muted-foreground truncate">{keyInfo.source_message}</span>
                </div>
                <Info className={cn("w-4 h-4 flex-shrink-0", getScoreColor(keyInfo.final_score))} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs bg-card border-2 border-primary/20">
              <div className="space-y-2 text-xs">
                <div className="font-bold text-primary border-b border-primary/20 pb-1">Mapping Details</div>
                <p><strong>Score:</strong> <span className={getScoreColor(keyInfo.final_score)}>{keyInfo.final_score.toFixed(3)}</span></p>
                <p><strong>Source Key:</strong> {keyInfo.source_key}</p>
                <p><strong>Message:</strong> {keyInfo.source_message}</p>
                <p><strong>File:</strong> {keyInfo.source_file}</p>
                <p><strong>Country:</strong> {keyInfo.source_country}</p>
                <p><strong>Domain:</strong> {keyInfo.source_domain}</p>
                <p><strong>System:</strong> {keyInfo.source_system}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </td>
    );
  };


  const renderDropdownCell = (targetMessage: string, targetKey: string) => {
    const key = `${targetMessage}::${targetKey}`;
    const allKeys = getAllKeysForTarget(targetMessage, targetKey);
    const searchTerm = searchTerms[key] || '';
    
    const filteredKeys = allKeys.filter(({ info }) => 
      info.source_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      info.source_message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <td className="px-4 py-3">
        <div className="relative">
          <Select
            value={selectedKeys[key] || ''}
            onValueChange={(value) => handleDropdownSelect(targetMessage, targetKey, value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select from all keys..." />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2 border-b sticky top-0 bg-background">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search keys..."
                    value={searchTerm}
                    onChange={(e) => {
                      e.stopPropagation();
                      setSearchTerms({ ...searchTerms, [key]: e.target.value });
                    }}
                    className="pl-8"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {filteredKeys.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No keys found
                  </div>
                ) : (
                  filteredKeys.map(({ keyNum, info }) => (
                    <SelectItem key={keyNum} value={keyNum}>
                      <div className="flex items-center text-center gap-2 py-1">
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{info.source_key}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {info.source_message} | Score: {info.final_score.toFixed(3)}
                          </div>
                        </div>
                        <Info className={cn("w-4 h-4", getScoreColor(info.final_score))} />
                      </div>
                    </SelectItem>
                  ))
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
      </td>
    );
  };

  // Preview Mode Component
  if (isPreviewMode) {
    const previewData: Array<{ targetKey: string; sourceKey: string; info: KeyInfo | null }> = [];
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key];
        const selectedKeyInfo = selectedKeyNum ? keys[selectedKeyNum as keyof typeof keys] : null;
        
        previewData.push({
          targetKey: `${targetMessage}::${targetKey}`,
          sourceKey: selectedKeyInfo 
            ? `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
            : 'None',
          info: selectedKeyInfo || null
        });
      });
    });

    return (
      <Dialog open={isOpen} onOpenChange={()=>setIsPreviewMode(false)}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent text-center bg-clip-text text-transparent">
            Mapping Preview
          </DialogTitle>

          <ScrollArea className="flex-1 mt-4 pr-4 overflow-scroll">
            <table className="w-full border-collapse border-2 border-border rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
                  <th className="px-6 py-4 text-left font-bold border-r-2 border-border w-1/2 text-primary">
                    Destination Key
                  </th>
                  <th className="px-6 py-4 text-left font-bold w-1/2 text-accent">
                    Selected Origin Key
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((mapping, index) => (
                  <tr key={index} className={cn(
                    "border-t-2 border-border transition-all hover:bg-muted/50",
                    index % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}>
                    <td className="px-6 py-4 font-semibold border-r-2 border-border">
                      {mapping.targetKey}
                    </td>
                    <td className="px-6 py-4">
                      {mapping.info ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 cursor-help">
                                <CheckCircle className={cn("w-4 h-4", getScoreColor(mapping.info.final_score))} />
                                <span className="font-semibold">{mapping.sourceKey}</span>
                                <Info className="w-4 h-4 text-muted-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs bg-card border-2 border-primary/20">
                              <div className="space-y-2 text-xs">
                                <div className="font-bold text-primary border-b border-primary/20 pb-1">Mapping Details</div>
                                <p><strong>Score:</strong> <span className={getScoreColor(mapping.info.final_score)}>{mapping.info.final_score.toFixed(3)}</span></p>
                                <p><strong>Source Key:</strong> {mapping.info.source_key}</p>
                                <p><strong>Message:</strong> {mapping.info.source_message}</p>
                                <p><strong>File:</strong> {mapping.info.source_file}</p>
                                <p><strong>Country:</strong> {mapping.info.source_country}</p>
                                <p><strong>Domain:</strong> {mapping.info.source_domain}</p>
                                <p><strong>System:</strong> {mapping.info.source_system}</p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <span className="text-muted-foreground italic">None mapped</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <div className="flex justify-center gap-4 pt-4 border-t">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setIsPreviewMode(false)}
              className="shadow-lg"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Edit
            </Button>
            <Button
              size="lg"
              onClick={handleApprove}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve Mapping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Approved Mode Component
  if (isApproved) {
    const approvedData: Array<{ targetKey: string; sourceKey: string }> = [];
    Object.entries(results).forEach(([targetMessage, mappings]) => {
      Object.entries(mappings).forEach(([targetKey, keys]) => {
        const key = `${targetMessage}::${targetKey}`;
        const selectedKeyNum = selectedKeys[key];
        
        if (selectedKeyNum) {
          const selectedKeyInfo = keys[selectedKeyNum as keyof typeof keys];
          if (selectedKeyInfo) {
            approvedData.push({
              targetKey: `${targetMessage}::${targetKey}`,
              sourceKey: `${selectedKeyInfo.source_message}::${selectedKeyInfo.source_key}`
            });
          }
        }
      });
    });

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Approved Mapping
          </DialogTitle>

          <ScrollArea className="flex-1 mt-4 pr-4 overflow-scroll">
            <table className="w-full border-collapse border-2 border-border rounded-lg overflow-hidden shadow-lg">
              <thead>
                <tr className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
                  <th className="px-6 py-4 text-left font-bold border-r-2 border-border w-1/2 text-primary">
                    Target Key
                  </th>
                  <th className="px-6 py-4 text-left font-bold w-1/2 text-accent">
                    Source Key
                  </th>
                </tr>
              </thead>
              <tbody>
                {approvedData.map((mapping, index) => (
                  <tr key={index} className={cn(
                    "border-t-2 border-border transition-all hover:bg-muted/50",
                    index % 2 === 0 ? "bg-card" : "bg-muted/20"
                  )}>
                    <td className="px-6 py-4 font-semibold border-r-2 border-border">
                      {mapping.targetKey}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      {mapping.sourceKey}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>

          <div className="flex justify-center pt-4 border-t">
            <Button
              size="lg"
              onClick={handleDownloadCSV}
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Download as CSV
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col ">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-center text-transparent">
          Mapping Results
        </DialogTitle>

        {/* Dual Handle Range Slider for Color Thresholds */}
        <div className="mt-0 px-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-border text-center ">
          <div className="mb-0 felx flex-col">
            <h5 className="text-sm font-semibold text-foreground mb-1">Color Thresholds</h5>
            <p className="text-xs text-muted-foreground">Drag the handles to adjust score color indicators</p>
          </div>
          
          <div className="space-y-0">
            {/* Dual Range Slider */}
            <div className="space-y-0">
              <div className="flex items-center justify-between mb-0">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0 rounded">
                    {lowThreshold.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0 rounded">
                    {highThreshold.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className="relative h-3 flex items-center">
                {/* Track Background */}
                <div className="absolute w-full h-1 bg-gradient-to-r from-red-300 to-green-300 rounded-lg"></div>
                
                {/* Active Track (between thumbs) */}
                <div 
                  className="absolute h-1 bg-yellow-400 rounded-xs"
                  style={{
                    left: `${lowThreshold * 100}%`,
                    right: `${100 - (highThreshold * 100)}%`
                  }}
                ></div>
                
                {/* Low Threshold Handle */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={lowThreshold}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val < highThreshold - 0.1) {
                      setLowThreshold(val);
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-yellow-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                  style={{ zIndex: lowThreshold > highThreshold - 0.15 ? 5 : 3 }}
                />
                
                {/* High Threshold Handle */}
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={highThreshold}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (val > lowThreshold + 0.1) {
                      setHighThreshold(val);
                    }
                  }}
                  className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-2 [&::-moz-range-thumb]:h-2 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-green-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:cursor-pointer"
                  style={{ zIndex: 4 }}
                />
              </div>
              
              {/* Labels below slider */}
              <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
                <span>0.00</span>
                <span>1.00</span>
              </div>
            </div>

            {/* Color Legend */}
            <div className="flex items-center justify-center gap-4 pt-0 border-t border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted-foreground">
                  &lt; {lowThreshold.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-xs text-muted-foreground">
                  {lowThreshold.toFixed(2)} - {highThreshold.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">
                  ≥ {highThreshold.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1 mt-1 pr-4">
          <div className="space-y-8">
            {Object.entries(results).map(([targetMessage, mappings]) => (
              <div key={targetMessage} className="space-y-4">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 border-b-2 border-primary">
                  <h3 className="text-xl font-semibold text-primary">{targetMessage}</h3>
                </div>

                <div className="overflow-scroll rounded-lg border-2 border-border shadow-lg">
                  <table className="w-[100%] border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-primary/20 to-accent/20">
                        <th className="px-3 py-4 text-left font-bold border-r-2 border-border bg-gradient-to-r from-primary/10 to-primary/5">
                          Destination Key
                        </th>
                        <th className="px-6 py-4 text-center font-bold border-r-2 border-border bg-gradient-to-r from-accent/10 to-accent/5" colSpan={3}>
                          Best three Mappings (tap to select)
                        </th>
                        <th className="px-6 py-4 text-center font-bold bg-gradient-to-r from-primary/5 to-accent/5">
                          All Keys
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(mappings).map(([targetKey, keys], index) => (
                        <tr key={targetKey} className={cn(
                          "border-t-2 border-border transition-all",
                          index % 2 === 0 ? "bg-card hover:bg-muted/30" : "bg-muted/20 hover:bg-muted/40"
                        )}>
                          <td className="px-6 py-4 font-bold border-r-1 text-center border-border bg-white text-black">
                            {targetKey}
                          </td>
                          {renderKeyCell(targetMessage, targetKey, 'key1', keys.key1)}
                          {renderKeyCell(targetMessage, targetKey, 'key2', keys.key2)}
                          {renderKeyCell(targetMessage, targetKey, 'key3', keys.key3)}
                          {renderDropdownCell(targetMessage, targetKey)}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setIsPreviewMode(true)}
            className="shadow-lg"
          >
            <Eye className="w-5 h-5 mr-2" />
            Preview Mapping
          </Button>
          <Button
            size="lg"
            onClick={handleApprove}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
          >
            {hasEdited ? (
              <>
                <Edit className="w-5 h-5 mr-2" />
                Approve Edited
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Approve
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};