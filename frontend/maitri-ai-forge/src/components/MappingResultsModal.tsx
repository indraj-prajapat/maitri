/* MappingResultsModal.tsx ---------------------------------------------- */
import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle,
  Edit,
  Eye,
  ArrowLeft,
  Search,
  AtSignIcon,
  Info,
} from 'lucide-react';
import * as XLSX from 'xlsx';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import TransformationResults from './Transformation';

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */
interface KeyInfo {
  final_score: number;
  source_message: string;
  source_key: string;
  source_file: string;
  source_country: string;
  source_domain: string;
  source_system: string;
  source_value?: string;
}

interface MappingResult {
  [targetMessage: string]: {
    [targetKey: string]: {
      key1?: KeyInfo;
      key2?: KeyInfo;
      key3?: KeyInfo;
      target_value?: string;
      target_m_n?: string;
    };
  };
}

interface MappingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MappingResult;
  onApprove?: (approvedMappings: ApprovedRow[]) => void;
  scoreThreshold?: number;
}

type ApprovedRow = {
  targetKey: string;
  sourceKey: string;
  targetMassage: string;
  sourceMassage: string;
  targetValue: string;
  sourceValue: string;
  editType: 'manual' | 'ai';
};

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */
const API_BASE_URL = 'http://localhost:5000/api';

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export const MappingResultsModal = ({
  isOpen,
  onClose, 
  results,
  onApprove,
  scoreThreshold = 0.45,
}: MappingResultsModalProps) => {
  /* -------------------------------------------------------------- */
  /* State                                                          */
  /* -------------------------------------------------------------- */
  const [selectedKeys, setSelectedKeys] = useState<Record<string, string | null>>({});
  const [isApproved, setIsApproved] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(true);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [currentThreshold, setCurrentThreshold] = useState(scoreThreshold);
  const [lowThreshold, setLowThreshold] = useState(0.4);
  const [highThreshold, setHighThreshold] = useState(0.8);
  const [transData, setTransData] = useState<any>(null);
  const [transView, setTransView] = useState(false);
  const [editedMap, setEditedMap] = useState<Record<string, string>>({});

  /* mirror of the *first* selection (what AI proposed) */
  const initialSelection = useRef<Record<string, string | null>>({});

  /* -------------------------------------------------------------- */
  /* Initialise selections (threshold aware)                      */
  /* -------------------------------------------------------------- */
  useEffect(() => {
    if (!isOpen || !Object.keys(results).length) return;

    const selections: Record<string, string | null> = {};
    const initial: Record<string, string | null> = {};

    Object.entries(results).forEach(([msg, maps]) => {
      Object.entries(maps).forEach(([k, { key1 }]) => {
        const id = `${msg}::${k}`;
        const pick = key1 && key1.final_score >= currentThreshold ? 'key1' : null;
        selections[id] = pick;
        initial[id] = pick;
      });
    });

    setSelectedKeys(selections);
    initialSelection.current = initial;
  }, [isOpen, results, currentThreshold]);

  /* -------------------------------------------------------------- */
  /* Edit tracking                                                  */
  /* -------------------------------------------------------------- */
  const updateEditedMap = (targetFullKey: string, newKeyNum: string | null) => {
    setEditedMap(prev => {
      const copy = { ...prev };

      /* what was originally selected? */
      const initialKey = initialSelection.current[targetFullKey];

      /* user went back to the original → remove entry */
      if (newKeyNum === initialKey) {
        delete copy[targetFullKey];
        return copy;
      }

      /* otherwise store the real pair */
      const [msg, key] = targetFullKey.split('::');
      const keyInfo = newKeyNum ? results[msg]?.[key]?.[newKeyNum as 'key1'|'key2'|'key3'] : null;
      copy[targetFullKey] = keyInfo
        ? `${keyInfo.source_message}::${keyInfo.source_key}`
        : 'NONE';
      return copy;
    });
  };

  /* -------------------------------------------------------------- */
  /* Handlers                                                       */
  /* -------------------------------------------------------------- */
  const handleKeySelect = (msg: string, key: string, kn: string | null) => {
    const id = `${msg}::${key}`;
    const cur = selectedKeys[id];

    if (cur === kn) {
      setSelectedKeys(p => ({ ...p, [id]: null }));
      updateEditedMap(id, null);
    } else {
      setSelectedKeys(p => ({ ...p, [id]: kn }));
      updateEditedMap(id, kn);
    }
    setHasEdited(true);
  };

  const handleDropdownSelect = (msg: string, key: string, kn: string) => {
    const id = `${msg}::${key}`;
    setSelectedKeys(p => ({ ...p, [id]: kn }));
    updateEditedMap(id, kn);
    setHasEdited(true);
  };

  /* -------------------------------------------------------------- */
  /* Approve                                                        */
  /* -------------------------------------------------------------- */
  const handleApprove = async () => {
    const approved: ApprovedRow[] = [];
    const preview: any[] = [];

    Object.entries(results).forEach(([msg, maps]) => {
      Object.entries(maps).forEach(([k, obj]) => {
        const id = `${msg}::${k}`;
        const kn = selectedKeys[id];
        const info = kn ? obj[kn as 'key1'|'key2'|'key3'] : null;

        const cleanMsg = info
          ? info.source_message.replace(' (based on past mapping)', '').trim()
          : null;

        approved.push({
          targetKey: k,
          targetMassage: msg,
          targetValue: obj.target_value ?? '',
          sourceMassage: info ? cleanMsg! : 'NONE',
          sourceValue: info ? info.source_value ?? 'NONE' : 'NONE',
          sourceKey: info ? info.source_key : 'NONE',
          editType: editedMap[id] ? 'manual' : 'ai',
        });

        if (info) {
          preview.push({
            targetKey: k,
            targetValue: obj.target_value ?? '',
            sourceValue: info.source_value ?? '',
            sourceKey: info.source_key,
          });
        }
      });
    });

    if (Object.keys(editedMap).length) {
      try {
        await fetch(`${API_BASE_URL}/editedMapping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editedMap),
        });
      } catch (e) {
        console.error('editedMapping call failed', e);
      }
    }

    setTransData(preview);
    setIsPreviewMode(false);
    setIsApproved(true);
    onApprove?.(approved);
  };

  /* -------------------------------------------------------------- */
  /* Export                                                         */
  /* -------------------------------------------------------------- */
  const downloadFile = (format: 'csv' | 'xlsx' | 'xml' | 'json') => {
    const rows: string[][] = [
      ['Destination Message', 'Destination Key', 'Origin Message', 'Origin Key', 'Edit Type'],
    ];

    Object.entries(results).forEach(([msg, maps]) => {
      Object.entries(maps).forEach(([k, obj]) => {
        const id = `${msg}::${k}`;
        const kn = selectedKeys[id];
        const info = kn ? obj[kn as 'key1'|'key2'|'key3'] : null;
        const flag = editedMap[id] ? 'manual' : 'ai';

        rows.push([
          msg,
          k,
          info ? info.source_message : 'None mapped',
          info ? info.source_key : 'None mapped',
          flag,
        ]);
      });
    });

    let blob: Blob;
    let fileName: string;

    if (format === 'csv') {
      const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      fileName = 'approved_mapping.csv';
    } else if (format === 'xlsx') {
      const ws = XLSX.utils.aoa_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Mapping');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fileName = 'approved_mapping.xlsx';
    } else if (format === 'xml') {
      let xml = '<?xml version="1.0" encoding="UTF-8"?><Mapping>';
      rows.slice(1).forEach(([tm, tk, sm, sk, et]) => {
        xml += `<item><TargetMessage>${tm}</TargetMessage><TargetKey>${tk}</TargetKey><SourceMessage>${sm}</SourceMessage><SourceKey>${sk}</SourceKey><EditType>${et}</EditType></item>`;
      });
      xml += '</Mapping>';
      blob = new Blob([xml], { type: 'application/xml' });
      fileName = 'approved_mapping.xml';
    } else {
      const arr = rows.slice(1).map(([tm, tk, sm, sk, et]) => ({
        targetMessage: tm,
        targetKey: tk,
        sourceMessage: sm,
        sourceKey: sk,
        editType: et,
      }));
      blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
      fileName = 'approved_mapping.json';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* -------------------------------------------------------------- */
  /* Render helpers                                                 */
  /* -------------------------------------------------------------- */
  const getAllKeysForTarget = (msg: string, k: string) => {
    const m = results[msg]?.[k];
    if (!m) return [];
    return Object.entries(m)
      .filter(([key]) => key.startsWith('key'))
      .map(([keyNum, info]) => ({ keyNum, info }));
  };

  const getScoreColor = (s: number) =>
    s >= highThreshold ? 'text-green-500' : s >= lowThreshold ? 'text-yellow-500' : 'text-red-500';

  const formatKey = (full: string) => {
    const [msg, k] = full.split('::');
    return (
      <div className="flex flex-col text-center">
        <div className="text-gray-400 text-xs">{msg} :</div>
        <strong className="text-blue-950">{k}</strong>
      </div>
    );
  };

  /* -------------------------------------------------------------- */
  /* Preview mode                                                   */
  /* -------------------------------------------------------------- */
  if (isPreviewMode) {
    const list: {
      targetKey: string;
      sourceKey: string;
      info: KeyInfo | null; 
      mandatory: boolean;
    }[] = [];

    Object.entries(results).forEach(([msg, maps]) => {
      Object.entries(maps).forEach(([k, obj]) => {
        const id = `${msg}::${k}`;
        const kn = selectedKeys[id];
        const info = kn ? obj[kn as 'key1'|'key2'|'key3'] : null;
        const clean = info
          ? info.source_message.replace(' (based on past mapping)', '').trim()
          : null;
        list.push({
          targetKey: `${msg}::${k}::${obj.target_value ?? ''}`,
          sourceKey: info
            ? `${clean}::${info.source_key}::${info.source_value ?? ''}`
            : 'None mapped',
          info,
          mandatory: obj.target_m_n === 'M',
        });
      });
    });

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-full max-h-[100vh] h-screen flex flex-col">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent text-center bg-clip-text text-transparent">
            Mapping Preview
          </DialogTitle>

          <div className="flex flex-col h-[79vh]">
            <div className="shrink-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 font-bold border-r-2 border-border text-primary flex justify-center">
                  Destination Key
                </div>
                <div className="px-6 py-4 font-bold text-accent flex justify-center">
                  Mapped Origin Key
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <table className="w-full border-separate border-spacing-0">
                <tbody>
                  {list.map((m, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'grid grid-cols-2 border-t-2 border-border transition-all hover:bg-muted/50',
                        i % 2 === 0 ? 'bg-card' : 'bg-card'
                      )}
                    >
                      <td className="px-6 py-4 border-r-2 border-border text-gray-300 flex flex-row items-center justify-center">
                        {formatKey(m.targetKey)}
                        {m.mandatory && <AtSignIcon className="w-4 h-4 ml-2 text-red-500" />}
                      </td>
                      <td className="px-6 py-4">
                        <div className='flex items-center justify-center'>
                        {m.info ? (
                          <TooltipProvider>
                            <Tooltip> 
                              <TooltipTrigger>
                                <div className="flex items-center gap-2 cursor-help justify-center">
                                  <span>{formatKey(m.sourceKey)}</span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-card border-2 border-primary/20 text-xs">
                                <div className="font-bold text-primary border-b pb-1">Mapping Details</div>
                                <p><strong>Score:</strong> <span className={getScoreColor(m.info.final_score)}>{m.info.final_score.toFixed(3)}</span></p>
                                <p><strong>Origin Key:</strong> {m.info.source_key}</p>
                                <p><strong>Message:</strong> {m.info.source_message}</p>
                                <p><strong>File:</strong> {m.info.source_file}</p>
                                <p><strong>Country:</strong> {m.info.source_country}</p>
                                <p><strong>Domain:</strong> {m.info.source_domain}</p>
                                <p><strong>System:</strong> {m.info.source_system}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <div className="flex justify-center">
                            <span className="text-muted-foreground italic">None mapped</span>
                          </div>
                        )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>

          <div className="flex justify-center gap-4 pt-2 border-t">
            <Button size="lg" variant="outline" onClick={() => setIsPreviewMode(false)}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Click to Edit
            </Button>
            <Button size="lg" onClick={handleApprove}>
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve Mapping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  /* -------------------------------------------------------------- */
  /* Approved mode                                                  */
  /* -------------------------------------------------------------- */
  if (isApproved) {
    const approvedList: {
      targetKey: string;
      targetValue: string;
      sourceKey: string;
      sourceValue: string;
    }[] = [];

    Object.entries(results).forEach(([msg, maps]) => {
      Object.entries(maps).forEach(([k, obj]) => {
        const id = `${msg}::${k}`;
        const kn = selectedKeys[id];
        const info = kn ? obj[kn as 'key1'|'key2'|'key3'] : null;
        const clean = info
          ? info.source_message.replace(' (based on past mapping)', '').trim()
          : null;

        approvedList.push({
          targetKey: `${msg}::${k}`,
          targetValue: obj.target_value ?? '',
          sourceKey: info ? `${clean}::${info.source_key}` : 'None mapped',
          sourceValue: info ? info.source_value ?? 'None mapped' : 'None mapped',
        });
      });
    });

    return (
      <>
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Approved Mapping
            </DialogTitle>

            <div className="shrink-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
              <div className="grid grid-cols-2">
                <div className="px-6 py-4 font-bold border-r-2 border-border text-primary flex justify-center">
                  Destination Key
                </div>
                <div className="px-6 py-4 font-bold text-accent flex justify-center">
                  Mapped Origin Key
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 pr-4 overflow-y-auto">
              <table className="w-full border-collapse border-2 border-border rounded-lg overflow-hidden shadow-lg">
                <tbody>
                  {approvedList.map((m, i) => (
                    <tr
                      key={i}
                      className={cn(
                        'border-t-2 border-border transition-all hover:bg-muted/50',
                        i % 2 === 0 ? 'bg-card' : 'bg-muted/20'
                      )}
                    >
                      <td className="px-6 py-4 font-semibold border-r-2 border-border">
                        {m.targetKey}
                      </td>
                      <td className="px-6 py-4 font-semibold">{m.sourceKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="flex flex-row justify-center gap-5 pt-4 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent shadow-lg">
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem onClick={() => downloadFile('csv')}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFile('xlsx')}>XLSX</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFile('xml')}>XML</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadFile('json')}>JSON</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="lg" onClick={() => setTransView(true)}>
                <CheckCircle className="w-5 h-5 mr-2" />
                See Transformations
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={transView} onOpenChange={setTransView}>
          <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-center text-transparent">
              Transformation View
            </DialogTitle>
            <TransformationResults transData={transData} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  /* -------------------------------------------------------------- */
  /* Main table view                                                */
  /* -------------------------------------------------------------- */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-center text-transparent">
          Mapping Results
        </DialogTitle>

        {/* -------------- threshold slider ---------------- */}
        <div className="px-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-border text-center">
          <h5 className="text-sm font-semibold mb-1">Color Thresholds</h5>
          <p className="text-xs text-muted-foreground mb-2">Drag to adjust colour indicators</p>
          <div className="relative h-3 flex items-center">
            <div className="absolute w-full h-1 bg-gradient-to-r from-red-300 to-green-300 rounded-lg" />
            <div
              className="absolute h-1 bg-yellow-400"
              style={{
                left: `${lowThreshold * 100}%`,
                right: `${100 - highThreshold * 100}%`,
              }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={lowThreshold}
              onChange={e => {
                const v = +e.target.value;
                if (v < highThreshold - 0.1) setLowThreshold(v);
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-none
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={highThreshold}
              onChange={e => {
                const v = +e.target.value;
                if (v > lowThreshold + 0.1) setHighThreshold(v);
              }}
              className="absolute w-full appearance-none bg-transparent pointer-events-none
                [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
                [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
            <span>0.00</span>
            <span>1.00</span>
          </div>
          <div className="flex items-center justify-center gap-4 pt-1 border-t border-border/50">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs">&lt; {lowThreshold.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-xs">
                {lowThreshold.toFixed(2)} - {highThreshold.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-xs">≥ {highThreshold.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* -------------- mappings table ---------------- */}
        <ScrollArea className="flex-1 mt-1 pr-4 overflow-y-auto overflow-x-scroll">
          <div className="space-y-8">
            {Object.entries(results).map(([msg, maps]) => (
              <div key={msg} className="space-y-4">
                <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 pb-2 border-b-2 border-primary">
                  <h3 className="text-xl font-semibold text-primary">{msg}</h3>
                </div>

                <div className="rounded-lg border-2 border-border shadow-lg">
                  <table className="w-full border-collapse">
                    <thead className="block bg-gradient-to-r from-primary/20 to-accent/20">
                      <tr className="grid grid-cols-5 w-full">
                        <th className="px-3 py-4 text-left font-bold border-r-2 border-border">
                          Destination Key
                        </th>
                        <th
                          className="px-6 py-4 font-bold border-r-2 border-border text-center"
                          style={{ gridColumn: 'span 3 / span 3' }}
                        >
                          Best three Mappings (tap to select)
                        </th>
                        <th className="px-6 py-4 font-bold text-center">
                          All Keys
                        </th>
                      </tr>
                    </thead>
                    <tbody className="block max-h-80 overflow-y-auto">
                      {Object.entries(maps).map(([k, obj], i) => (
                        <tr
                          key={k}
                          className={cn(
                            'grid grid-cols-5 border-t-2 border-border transition-all',
                            i % 2 === 0 ? 'bg-card hover:bg-muted/30' : 'bg-muted/20 hover:bg-muted/40'
                          )}
                        >
                          <td className="px-6 py-4 font-bold border-r-2 border-border bg-white text-black">
                            <div className="flex flex-col">
                              <div className="flex flex-row">
                                <span className="font-bold text-black">{k}</span>
                                {obj.target_m_n === 'M' && (
                                  <AtSignIcon className="w-4 h-4 inline-block ml-2 text-red-500" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600 mt-1 font-normal">
                                {obj.target_value || '--'}
                              </span>
                            </div>
                          </td>

                          {/* key1 / key2 / key3 */}
                          {[1, 2, 3].map(n => {
                            const info = obj[`key${n}` as 'key1'|'key2'|'key3'];
                            const id = `${msg}::${k}`;
                            const selected = selectedKeys[id] === `key${n}`;
                            return (
                              <td
                                key={n}
                                className={cn(
                                  'px-4 py-3 border-r border-border/50 cursor-pointer transition-all',
                                  selected
                                    ? 'bg-blue-100 ring-2 ring-primary/40 shadow-sm'
                                    : 'hover:bg-muted/20 bg-white text-gray-500'
                                )}
                                onClick={() => handleKeySelect(msg, k, `key${n}`)}
                              >
                                {info ? (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger className='w-[100%]'>
                                        <div className="flex items-center justify-between w-full ">
                                          {/* left column: text */}
                                          <div className="flex flex-col text-left ">
                                            <span className="font-semibold text-sm truncate">{info.source_key}</span>
                                            <span className="text-xs text-muted-foreground truncate">{info.source_message}</span>
                                            <span className="text-xs text-muted-foreground truncate">{info.source_value}</span>
                                          </div>

                                          {/* right: icon */}
                                          <div>
                                          <Info className={cn('w-4 h-4 flex-shrink-0', getScoreColor(info.final_score))} />
                                          </div>
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent className="max-w-xs bg-card border-2 border-primary/20 text-xs">
                                        <div className="font-bold text-primary border-b pb-1">Mapping Details</div>
                                        <p><strong>Score:</strong> <span className={getScoreColor(info.final_score)}>{info.final_score.toFixed(3)}</span></p>
                                        <p><strong>Origin Key:</strong> {info.source_key}</p>
                                        <p><strong>Message:</strong> {info.source_message}</p>
                                        <p><strong>File:</strong> {info.source_file}</p>
                                        <p><strong>Country:</strong> {info.source_country}</p>
                                        <p><strong>Domain:</strong> {info.source_domain}</p>
                                        <p><strong>System:</strong> {info.source_system}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                ) : (
                                  <div className="text-center text-sm text-muted-foreground">-</div>
                                )}
                              </td>
                            );
                          })}

                          {/* dropdown for "all keys" */}
                          <td className="px-4 py-3">
                            <div className="relative">
                              <Select
                                value={selectedKeys[`${msg}::${k}`] || ''}
                                onValueChange={v => handleDropdownSelect(msg, k, v)}
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
                                        value={searchTerms[`${msg}::${k}`] || ''}
                                        onChange={e => {
                                          e.stopPropagation();
                                          setSearchTerms(p => ({ ...p, [`${msg}::${k}`]: e.target.value }));
                                        }}
                                        className="pl-8"
                                        onClick={e => e.stopPropagation()}
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto">
                                    {getAllKeysForTarget(msg, k)
                                      .filter(
                                        ({ info }) =>
                                          info.source_key.toLowerCase().includes(
                                            (searchTerms[`${msg}::${k}`] || '').toLowerCase()
                                          ) ||
                                          info.source_message
                                            .toLowerCase()
                                            .includes((searchTerms[`${msg}::${k}`] || '').toLowerCase())
                                      )
                                      .map(({ keyNum, info }) => (
                                        <SelectItem key={keyNum} value={keyNum} className='w-[100%]'>
                                          <div className="flex flex-row items-between gap-3  py-1">
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-semibold truncate">{info.source_key}</div>
                                              <div className="text-xs text-muted-foreground truncate">
                                                {info.source_message} | Score: {info.final_score.toFixed(3)}
                                              </div>
                                            </div>
                                            <Info className={cn('w-4 h-4', getScoreColor(info.final_score))} />
                                          </div>
                                        </SelectItem>
                                      ))}
                                  </div>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* -------------- footer ---------------- */}
        <div className="flex justify-center gap-4 pt-4 border-t">
          <Button size="lg" variant="outline" onClick={() => setIsPreviewMode(true)}>
            <Eye className="w-5 h-5 mr-2" />
            Preview Mapping
          </Button>
          <Button size="lg" onClick={handleApprove}>
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