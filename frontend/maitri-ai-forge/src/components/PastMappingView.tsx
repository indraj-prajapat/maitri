import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Edit2, Check, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ApprovedMappingViewProps {
  isOpen;
  onClose: () => void;
  mappings;
  onSave;
}

/* ----------  COMPONENT  ---------- */
export const PastMappingView = ({
  isOpen,
  onClose,
  mappings,
  onSave,
}: ApprovedMappingViewProps) => {
  /* stable state with unique id */
  
  console.log('Rendering PastMappingView with mappings:', mappings);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState({
    sourceKey: '',
    sourceMassage: '',
    sourceValue: '',
    targetMassage: '',
    targetKey: '',
    targetValue: '',
    transformationNeeded: '',
    transformationComments: '',
  });

  /* ------------  EDIT LOGIC  ------------ */
  const handleEdit = (id: string) => {
    const row = mappings.find((m) => m.id === id);
    if (!row) return;
    setEditingId(id);
    setEditValue(row);
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    // setMappings((prev) =>
    //   prev.map((m) => (m.id === editingId ? editValue : m))
    // );
    console.log('Edited mapping id', editingId)
    onSave(editValue);
    setEditingId(null);
    /* ---- blink the dialog ---- */
    
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue({
      sourceKey: '',
      sourceMassage: '',
      sourceValue: '',
      targetMassage: '',
      targetKey: '',
      targetValue: '',
      transformationNeeded: '',
      transformationComments: '',
    });
  };

  /* ------------  DOWNLOAD  ------------ */
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
    const head =
      'Source Key,Source Massage,Source Value,Target Massage,Target Key,Target Value,Transformation Needed,Transformation Comments';
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const rows = mappings.map((m) =>
      [
        escape(m.sourceKey),
        escape(m.sourceMassage),
        escape(m.sourceValue),
        escape(m.targetMassage),
        escape(m.targetKey),
        escape(m.targetValue),
        escape(m.transformationNeeded),
        escape(m.transformationComments),
      ].join(',')
    );
    const blob = new Blob([head + '\n' + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    downloadFile(blob, 'approved_mapping.csv');
  };

  const downloadXLSX = () => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      alert('XLSX library not available. Downloading as CSV instead.');
      downloadCSV();
      return;
    }
    const wsData: (string | number)[][] = [
      [
        'Source Key',
        'Source Massage',
        'Source Value',
        'Target Massage',
        'Target Key',
        'Target Value',
        'Transformation Needed',
        'Transformation Comments',
      ],
      ...mappings.map((m) => [
        m.sourceKey,
        m.sourceMassage,
        m.sourceValue,
        m.targetMassage,
        m.targetKey,
        m.targetValue,
        m.transformationNeeded,
        m.transformationComments,
      ]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Mappings');
    XLSX.writeFile(wb, 'approved_mapping.xlsx');
  };

  const downloadXML = () => {
    const esc = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    let xml =
      '<?xml version="1.0" encoding="UTF-8"?>\n<mappings>\n';
    mappings.forEach((m, idx) => {
      xml += `  <mapping id="${idx + 1}">\n`;
      xml += `    <source>\n`;
      xml += `      <key>${esc(m.sourceKey)}</key>\n`;
      xml += `      <massage>${esc(m.sourceMassage)}</massage>\n`;
      xml += `      <value>${esc(m.sourceValue)}</value>\n`;
      xml += `    </source>\n`;
      xml += `    <target>\n`;
      xml += `      <key>${esc(m.targetKey)}</key>\n`;
      xml += `      <massage>${esc(m.targetMassage)}</massage>\n`;
      xml += `      <value>${esc(m.targetValue)}</value>\n`;
      xml += `    </target>\n`;
      xml += `    <transformation>\n`;
      xml += `      <needed>${esc(m.transformationNeeded)}</needed>\n`;
      xml += `      <comments>${esc(m.transformationComments)}</comments>\n`;
      xml += `    </transformation>\n`;
      xml += `  </mapping>\n`;
    });
    xml += '</mappings>';
    downloadFile(
      new Blob([xml], { type: 'application/xml;charset=utf-8;' }),
      'approved_mapping.xml'
    );
  };

  const downloadJSON = () => {
    downloadFile(
      new Blob([JSON.stringify({ mappings }, null, 2)], {
        type: 'application/json;charset=utf-8;',
      }),
      'approved_mapping.json'
    );
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url,
      download: filename,
      style: { visibility: 'hidden' },
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ------------  RENDER  ------------ */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Past Approved Mapping
        </DialogTitle>

        <ScrollArea className="flex-1 mt-4 pr-4">
          <div className="space-y-4">
            {mappings.map((mapping, idx) => (
              <div
                key={mapping.id}
                className="bg-gradient-to-br from-card via-card to-muted/30 border-2 border-border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* header */}
                <div className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 px-6 py-3 border-b-2 border-border flex justify-between items-center">
                  <h3 className="font-bold text-lg">Mapping Field #{idx + 1}</h3>
                  {editingId === mapping.id ? (
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
                      onClick={() => handleEdit(mapping.id)}
                      className="hover:bg-primary/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* body */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Target */}
                  <div className="space-y-3 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-semibold text-sm text-green-700 dark:text-green-300 uppercase tracking-wide">
                      Target
                    </h4>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Massage *</label>
                      {editingId === mapping.id ? (
                        <Input
                          value={editValue.targetMassage}
                          onChange={(e) =>
                            setEditValue({ ...editValue, targetMassage: e.target.value })
                          }
                          className="w-full border-2 focus:border-green-500"
                          required
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                          {mapping.targetMassage}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Key *</label>
                      {editingId === mapping.id ? (
                        <Input
                          value={editValue.targetKey}
                          onChange={(e) =>
                            setEditValue({ ...editValue, targetKey: e.target.value })
                          }
                          className="w-full border-2 focus:border-green-500"
                          required
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                          {mapping.targetKey}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Value</label>
                      {editingId === mapping.id ? (
                        <Input
                          value={editValue.targetValue}
                          onChange={(e) =>
                            setEditValue({ ...editValue, targetValue: e.target.value })
                          }
                          className="w-full border-2 focus:border-green-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                          {mapping.targetValue || '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Source */}
                  <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-sm text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                      Source
                    </h4>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Massage</label>
                      {editingId === mapping.id ? (
                        <Input
                          value={editValue.sourceMassage}
                          onChange={(e) =>
                            setEditValue({ ...editValue, sourceMassage: e.target.value })
                          }
                          className="w-full border-2 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                          {mapping.sourceMassage || '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Key</label>
                      {editingId === mapping.id ? (
                        <Input
                          value={editValue.sourceKey}
                          onChange={(e) =>
                            setEditValue({ ...editValue, sourceKey: e.target.value })
                          }
                          className="w-full border-2 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                          {mapping.sourceKey || '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Value</label>
                      {editingId === mapping.id ? (
                        <Input
                          value={editValue.sourceValue}
                          onChange={(e) =>
                            setEditValue({ ...editValue, sourceValue: e.target.value })
                          }
                          className="w-full border-2 focus:border-blue-500"
                        />
                      ) : (
                        <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                          {mapping.sourceValue || '-'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Transformation (read-only) */}
                  <div className="space-y-3 bg-purple-50/50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-semibold text-sm text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                      Transformation
                    </h4>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Needed</label>
                      <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                        {mapping.transformationNeeded || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Comments</label>
                      <p className="text-sm font-medium bg-white dark:bg-card p-2 rounded border">
                        {mapping.transformationComments || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Download dropdown */}
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
