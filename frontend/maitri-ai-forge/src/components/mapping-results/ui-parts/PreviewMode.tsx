import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PreviewRow } from '../hooks/usePreviewData';
import { getScoreColor } from '../utils/scoreColors';

interface Props {
  rows: PreviewRow[];
  onApprove: () => void;
  onBack: () => void;
}

const formatKey = (full: string) => {
  const [msg, key, val] = full.split('::');
  return (
    <div className="flex flex-col text-center">
      <div className="text-gray-400 text-xs">{msg} :</div>
      <strong className="text-blue-950">{key}</strong>
      {val && <div className="text-xs text-gray-500 truncate">{val}</div>}
    </div>
  );
};

export const PreviewMode = ({ rows, onApprove, onBack }: Props) => (
  <div className="flex flex-col h-full">
    <div className="shrink-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
      <div className="grid grid-cols-2">
        <div className="px-6 py-4 font-bold border-r-2 border-border text-primary flex justify-center">Destination Key</div>
        <div className="px-6 py-4 font-bold text-accent flex justify-center">Mapped Origin Key</div>
      </div>
    </div>

    <ScrollArea className="flex-1">
      <table className="w-full border-separate border-spacing-0">
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={cn('grid grid-cols-2 border-t-2 border-border transition-all hover:bg-muted/50', i % 2 === 0 ? 'bg-card' : 'bg-card')}
            >
              <td className="px-6 py-4 border-r-2 border-border text-gray-300">{formatKey(r.targetKey)}</td>
              <td className="px-6 py-4">
                {r.info ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 cursor-help justify-center">{formatKey(r.sourceKey)}</div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs bg-card border-2 border-primary/20">
                        <div className="space-y-2 text-xs">
                          <div className="font-bold text-primary border-b border-primary/20 pb-1">Mapping Details</div>
                          <p><strong>Score:</strong> <span className={getScoreColor(r.info.final_score, 0.4, 0.8)}>{r.info.final_score.toFixed(3)}</span></p>
                          <p><strong>Source Key:</strong> {r.info.source_key}</p>
                          <p><strong>Message:</strong> {r.info.source_message}</p>
                          <p><strong>File:</strong> {r.info.source_file}</p>
                          <p><strong>Country:</strong> {r.info.source_country}</p>
                          <p><strong>Domain:</strong> {r.info.source_domain}</p>
                          <p><strong>System:</strong> {r.info.source_system}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div className="flex justify-center"><span className="text-muted-foreground italic">None mapped</span></div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>

    <div className="flex justify-center gap-4 pt-4 border-t">
      <Button size="lg" variant="outline" onClick={onBack} className="shadow-lg">
        <ArrowLeft className="w-5 h-5 mr-2" /> Click to Edit
      </Button>
      <Button size="lg" onClick={onApprove} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
        <CheckCircle className="w-5 h-5 mr-2" /> Approve Mapping
      </Button>
    </div>
  </div>
);