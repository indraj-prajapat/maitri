import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyInfo } from '../types';
import { getScoreColor } from '../utils/scoreColors';

interface Props {
  targetMessage: string;
  targetKey: string;
  keyNum: string;
  keyInfo?: KeyInfo;
  isSelected: boolean;
  onToggle: () => void;
}

export const KeyCell = ({ keyInfo, isSelected, onToggle }: Props) => {
  if (!keyInfo)
    return (
      <td className="px-4 py-3 border-r border-border/50 bg-muted/10 text-center text-sm text-muted-foreground">-</td>
    );

  return (
    <td
      onClick={onToggle}
      className={cn(
        'px-4 py-3 border-r border-border/50 cursor-pointer transition-all',
        isSelected ? 'bg-blue-100 ring-2 ring-primary/40 shadow-sm' : 'hover:bg-muted/20 bg-white text-gray-500'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-semibold text-sm truncate">{keyInfo.source_key}</span>
                <span className="text-xs text-muted-foreground truncate">{keyInfo.source_message}</span>
                <span className="text-xs text-muted-foreground truncate">{keyInfo.source_value}</span>
              </div>
              <Info className={cn('w-4 h-4 flex-shrink-0', getScoreColor(keyInfo.final_score, 0.4, 0.8))} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs bg-card border-2 border-primary/20">
            <div className="space-y-2 text-xs">
              <div className="font-bold text-primary border-b border-primary/20 pb-1">Mapping Details</div>
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