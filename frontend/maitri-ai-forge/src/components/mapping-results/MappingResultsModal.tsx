import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, Edit } from 'lucide-react';
import { MappingResultsModalProps } from './types';
import { useColorThresholds } from './hooks/useColorThresholds';
import { useKeySelection } from './hooks/useKeySelection';
import { usePreviewData } from './hooks/usePreviewData';
import { buildCsv, downloadCsv } from './utils/csv';
import { DualRangeSlider } from './ui-parts/DualRangeSlider';
import { SelectedCell } from './ui-parts/SelectedCell';
import { KeyCell } from './ui-parts/KeyCell';
import { DropdownCell } from './ui-parts/DropdownCell';
import { PreviewMode } from './ui-parts/PreviewMode';
import { ApprovedMode } from './ui-parts/ApprovedMode';
import { cn } from '@/lib/utils';

export const MappingResultsModal = ({
  isOpen,
  onClose,
  results,
  onApprove,
  scoreThreshold = 0.5,
}: MappingResultsModalProps) => {
  const [isPreview, setIsPreview] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});

  const thresholds = useColorThresholds(0.4, 0.8);
  const { selectedKeys, select } = useKeySelection(results, isOpen, scoreThreshold);

  useEffect(() => {
    if (isOpen) {
      setIsPreview(true);
      setIsApproved(false);
    }
  }, [isOpen]);

  const previewRows = usePreviewData(results, selectedKeys);

  const approvedRows = previewRows.map((r) => ({
    targetKey: r.targetKey.split('::').slice(0, 2).join('::'),
    sourceKey: r.info ? `${r.info.source_message}::${r.info.source_key}` : 'None mapped',
  }));

  const handleApprove = () => {
    const mappings: Array<{ targetKey: string; sourceKey: string }> = [];
    Object.entries(results).forEach(([msg, mappingsObj]) => {
      Object.entries(mappingsObj).forEach(([key, keySet]) => {
        const unique = `${msg}::${key}`;
        const selectedKeyNum = selectedKeys[unique];
        const info = selectedKeyNum ? keySet[selectedKeyNum as keyof typeof keySet] : null;
        mappings.push({
          targetKey: unique,
          sourceKey: info ? `${info.source_message}::${info.source_key}` : 'NONE',
        });
      });
    });
    onApprove?.(mappings);
    setIsApproved(true);
    setIsPreview(false);
  };

  const handleDownload = () => downloadCsv(buildCsv(results, selectedKeys));

  if (isPreview)
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full max-h-[100vh] h-screen flex flex-col overflow-scroll">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent text-center bg-clip-text text-transparent">
            Mapping Preview
          </DialogTitle>
          <PreviewMode rows={previewRows} onApprove={handleApprove} onBack={() => setIsPreview(false)} />
        </DialogContent>
      </Dialog>
    );

  if (isApproved)
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Approved Mapping
          </DialogTitle>
          <ApprovedMode rows={approvedRows} onDownload={handleDownload} />
        </DialogContent>
      </Dialog>
    );

  /* -------------------- MAIN TABLE MODE -------------------- */
  const getAllKeys = (msg: string, key: string) => {
    const set = results[msg]?.[key];
    if (!set) return [];
    return Object.entries(set)
      .filter(([k]) => k.startsWith('key'))
      .map(([keyNum, info]) => ({ keyNum, info: info as any }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-center text-transparent">
          Mapping Results
        </DialogTitle>

        <DualRangeSlider thresholds={thresholds} />

        <div className="flex-1 mt-1 pr-4 overflow-y-auto overflow-x-scroll">
          <div className="space-y-8">
            {Object.entries(results).map(([msg, mappings]) => (
              <div key={msg} className="space-y-4">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 border-b-2 border-primary">
                  <h3 className="text-xl font-semibold text-primary">{msg}</h3>
                </div>

                <div className="rounded-lg border-2 border-border shadow-lg">
                  <table className="w-full border-collapse">
                    <thead className="block bg-gradient-to-r from-primary/20 to-accent/20">
                      <tr className="grid grid-cols-5 w-full">
                        <th className="px-3 py-4 text-left font-bold border-r-2 border-border">Destination Key</th>
                        <th className="px-6 py-4 font-bold border-r-2 border-border text-center" style={{ gridColumn: 'span 3 / span 3' }}>
                          Best three Mappings (tap to select)
                        </th>
                        <th className="px-6 py-4 font-bold text-center">All Keys</th>
                      </tr>
                    </thead>
                    <tbody className="block max-h-80 overflow-y-auto">
                      {Object.entries(mappings).map(([key, keySet], idx) => {
                        const unique = `${msg}::${key}`;
                        const allKeys = getAllKeys(msg, key);
                        return (
                          <tr
                            key={key}
                            className={cn(
                              'grid grid-cols-5 border-t-2 border-border transition-all',
                              idx % 2 === 0 ? 'bg-card hover:bg-muted/30' : 'bg-muted/20 hover:bg-muted/40'
                            )}
                          >
                            <td className="px-6 py-4 font-bold border-r-2 border-border bg-white text-black">
                              <div className="flex flex-col">
                                <span className="font-bold text-black">{key}</span>
                                <span className="text-xs text-gray-600 mt-1 font-normal">{keySet?.target_value || '--'}</span>
                              </div>
                            </td>

                            <KeyCell
                              keyInfo={keySet?.key1}
                              isSelected={selectedKeys[unique] === 'key1'}
                              onToggle={() => {
                                select(unique, selectedKeys[unique] === 'key1' ? null : 'key1');
                                setHasEdited(true);
                              }}
                              targetMessage={msg}
                              targetKey={key}
                              keyNum="key1"
                            />
                            <KeyCell
                              keyInfo={keySet?.key2}
                              isSelected={selectedKeys[unique] === 'key2'}
                              onToggle={() => {
                                select(unique, selectedKeys[unique] === 'key2' ? null : 'key2');
                                setHasEdited(true);
                              }}
                              targetMessage={msg}
                              targetKey={key}
                              keyNum="key2"
                            />
                            <KeyCell
                              keyInfo={keySet?.key3}
                              isSelected={selectedKeys[unique] === 'key3'}
                              onToggle={() => {
                                select(unique, selectedKeys[unique] === 'key3' ? null : 'key3');
                                setHasEdited(true);
                              }}
                              targetMessage={msg}
                              targetKey={key}
                              keyNum="key3"
                            />

                            <DropdownCell
                              allKeys={allKeys}
                              selectedKeyNum={selectedKeys[unique]}
                              onSelect={(k) => {
                                select(unique, k);
                                setHasEdited(true);
                              }}
                              targetMessage={msg}
                              targetKey={key}
                            />
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button size="lg" variant="outline" onClick={() => setIsPreview(true)} className="shadow-lg">
            <Eye className="w-5 h-5 mr-2" /> Preview Mapping
          </Button>
          <Button size="lg" onClick={handleApprove} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
            {hasEdited ? (
              <>
                <Edit className="w-5 h-5 mr-2" /> Approve Edited
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" /> Approve
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};