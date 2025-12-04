import { cn } from '@/lib/utils';
import { CheckCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyInfo } from '../types';
import { getScoreColor, getScoreBgColor } from '../utils/scoreColors';

interface Props {
  keyInfo?: KeyInfo;
}

export const SelectedCell = ({ keyInfo }: Props) => {
  if (!keyInfo)
    return (
      <td className="px-4 py-3 border-r border-border/50 bg-muted/20">
        <div className="text-center text-muted-foreground text-sm italic">None selected</div>
      </td>
    );

  return (
    <td className={cn('px-4 py-3 border-r border-border/50 bg-gradient-to-r from-green-50 to-blue-50')}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <CheckCircle className={cn('w-4 h-4', getScoreColor(keyInfo.final_score, 0.4, 0.8))} />
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
              <p><strong>Score:</strong> <span className={getScoreColor(keyInfo.final_score, 0.4, 0.8)}>{keyInfo.final_score.toFixed(3)}</span></p>
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