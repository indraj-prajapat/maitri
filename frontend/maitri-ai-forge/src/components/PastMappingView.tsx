import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Edit2, Check, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApprovedMapping {
  sourceKey: string;
  sourceMassage: string;
  sourceValue: string;
  targetMassage: string;
  targetKey: string;
  targetValue: string;
  transformationNeeded: string;
  transformationComments: string;
}

interface ApprovedMappingViewProps {
  isOpen: boolean;
  onClose: () => void;
  mappings: ApprovedMapping[];
  onSave;
}

export const PastMappingView = ({ isOpen, onClose, mappings: initialMappings, onSave }: ApprovedMappingViewProps) => {
  const [mappings, setMappings] = useState<ApprovedMapping[]>(initialMappings);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<ApprovedMapping>({
    sourceKey: '',
    sourceMassage: '',
    sourceValue: '',
    targetMassage: '',
    targetKey: '',
    targetValue: '',
    transformationNeeded: '',
    transformationComments: ''
  });
 
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(mappings[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null) {
      const newMappings = [...mappings];
      console.log('Saving edited mapping at index:', editingIndex, 'New Value:', editValue);
      newMappings[editingIndex] = editValue;
      setMappings(newMappings);
      setEditingIndex(null);
      onSave?.(editValue);
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditValue({
      sourceKey: '',
      sourceMassage: '',
      sourceValue: '',
      targetMassage: '',
      targetKey: '',
      targetValue: '',
      transformationNeeded: '',
      transformationComments: ''
    });
  };

  const handleDownload = (format: 'csv' | 'xlsx' | 'xml' | 'json') => {
    switch (format) {
      case 'csv':
        downloadCSV();
        break;
      case 'xlsx':
        downloadXLSX();
        break;
      case 'xml':
        downloadXML();
        break;
      case 'json':
        downloadJSON();
        break;
    }
  };

  const downloadCSV = () => {
    const csvRows = ['Source Key,Source Massage,Source Value,Target Massage,Target Key,Target Value,Transformation Needed,Transformation Comments'];
    mappings.forEach(({ sourceKey, sourceMassage, sourceValue, targetMassage, targetKey, targetValue, transformationNeeded, transformationComments }) => {
      const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      csvRows.push([
        escapeCsv(sourceKey || ''),
        escapeCsv(sourceMassage || ''),
        escapeCsv(sourceValue || ''),
        escapeCsv(targetMassage || ''),
        escapeCsv(targetKey || ''),
        escapeCsv(targetValue || ''),
        escapeCsv(transformationNeeded || ''),
        escapeCsv(transformationComments || '')
      ].join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, 'approved_mapping.csv');
  };

  const downloadXLSX = () => {
    // Create XLSX content using SheetJS format
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      // Fallback to CSV if SheetJS is not available
      alert('XLSX library not available. Downloading as CSV instead.');
      downloadCSV();
      return;
    }

    const worksheet_data = [
      ['Source Key', 'Source Massage', 'Source Value', 'Target Massage', 'Target Key', 'Target Value', 'Transformation Needed', 'Transformation Comments']
    ];
    
    mappings.forEach(m => {
      worksheet_data.push([
        m.sourceKey || '',
        m.sourceMassage || '',
        m.sourceValue || '',
        m.targetMassage || '',
        m.targetKey || '',
        m.targetValue || '',
        m.transformationNeeded || '',
        m.transformationComments || ''
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(worksheet_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mappings');
    XLSX.writeFile(wb, 'approved_mapping.xlsx');
  };

  const downloadXML = () => {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<mappings>\n';
    
    mappings.forEach((mapping, index) => {
      xmlContent += `  <mapping id="${index + 1}">\n`;
      xmlContent += `    <source>\n`;
      xmlContent += `      <key>${escapeXml(mapping.sourceKey || '')}</key>\n`;
      xmlContent += `      <massage>${escapeXml(mapping.sourceMassage || '')}</massage>\n`;
      xmlContent += `      <value>${escapeXml(mapping.sourceValue || '')}</value>\n`;
      xmlContent += `    </source>\n`;
      xmlContent += `    <target>\n`;
      xmlContent += `      <key>${escapeXml(mapping.targetKey || '')}</key>\n`;
      xmlContent += `      <massage>${escapeXml(mapping.targetMassage || '')}</massage>\n`;
      xmlContent += `      <value>${escapeXml(mapping.targetValue || '')}</value>\n`;
      xmlContent += `    </target>\n`;
      xmlContent += `    <transformation>\n`;
      xmlContent += `      <needed>${escapeXml(mapping.transformationNeeded || '')}</needed>\n`;
      xmlContent += `      <comments>${escapeXml(mapping.transformationComments || '')}</comments>\n`;
      xmlContent += `    </transformation>\n`;
      xmlContent += `  </mapping>\n`;
    });
    
    xmlContent += '</mappings>';
    
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8;' });
    downloadFile(blob, 'approved_mapping.xml');
  };

  const downloadJSON = () => {
    const jsonContent = JSON.stringify({ mappings }, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    downloadFile(blob, 'approved_mapping.json');
  };

  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Approved Mapping
        </DialogTitle>

        <ScrollArea className="flex-1 mt-4 pr-4">
          <div className="space-y-4">
            {mappings.map((mapping, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-card via-card to-muted/30 border-2 border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 px-6 py-3 border-b-2 border-border flex justify-between items-center">
                  <h3 className="font-bold text-lg">Mapping Field #{index + 1}</h3>
                  {editingIndex === index ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleSaveEdit}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(index)}
                      className="hover:bg-primary/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Target Section - Left */}
                  <div className="space-y-3 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 uppercase tracking-wide">Target</h4>
                    
                    

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Massage *</label>
                      {editingIndex === index ? (
                        <Input
                          value={editValue.targetMassage}
                          onChange={(e) => setEditValue({ ...editValue, targetMassage: e.target.value })}
                          className="w-full border-2 focus:border-green-500"
                          required
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.targetMassage}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Key *</label>
                      {editingIndex === index ? (
                        <Input
                          value={editValue.targetKey}
                          onChange={(e) => setEditValue({ ...editValue, targetKey: e.target.value })}
                          className="w-full border-2 focus:border-green-500"
                          required
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.targetKey}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Value</label>
                      {editingIndex === index ? (
                        <Input
                          value={editValue.targetValue}
                          onChange={(e) => setEditValue({ ...editValue, targetValue: e.target.value })}
                          className="w-full border-2 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.targetValue || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Source Section - Middle */}
                  <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wide">Source</h4>
                    
                    

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Massage</label>
                      {editingIndex === index ? (
                        <Input
                          value={editValue.sourceMassage}
                          onChange={(e) => setEditValue({ ...editValue, sourceMassage: e.target.value })}
                          className="w-full border-2 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.sourceMassage || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Key</label>
                      {editingIndex === index ? (
                        <Input
                          value={editValue.sourceKey}
                          onChange={(e) => setEditValue({ ...editValue, sourceKey: e.target.value })}
                          className="w-full border-2 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.sourceKey || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Value</label>
                      {editingIndex === index ? (
                        <Input
                          value={editValue.sourceValue}
                          onChange={(e) => setEditValue({ ...editValue, sourceValue: e.target.value })}
                          className="w-full border-2 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.sourceValue || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Transformation Section - Right (Read-only) */}
                  <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-300 uppercase tracking-wide">Transformation</h4>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Needed</label>
                      <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.transformationNeeded || '-'}</p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Comments</label>
                      <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">{mapping.transformationComments || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-center pt-4 border-t gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Mapping
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-56">
              <DropdownMenuItem onClick={() => handleDownload('csv')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-green-700 dark:text-green-300">CSV</span>
                  </div>
                  <div>
                    <div className="font-medium">CSV Format</div>
                    <div className="text-xs text-muted-foreground">Comma-separated values</div>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('xlsx')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">XLS</span>
                  </div>
                  <div>
                    <div className="font-medium">Excel Format</div>
                    <div className="text-xs text-muted-foreground">Microsoft Excel file</div>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('xml')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300">XML</span>
                  </div>
                  <div>
                    <div className="font-medium">XML Format</div>
                    <div className="text-xs text-muted-foreground">Extensible markup language</div>
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('json')} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-300">JSON</span>
                  </div>
                  <div>
                    <div className="font-medium">JSON Format</div>
                    <div className="text-xs text-muted-foreground">JavaScript object notation</div>
                  </div>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </DialogContent>
    </Dialog>
  );
};