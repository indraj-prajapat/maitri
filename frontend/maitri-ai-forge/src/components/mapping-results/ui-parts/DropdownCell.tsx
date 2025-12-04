import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import { KeyInfo } from '../types';
import { getScoreColor } from '../utils/scoreColors';

interface Props {
  targetMessage: string;
  targetKey: string;
  allKeys: { keyNum: string; info: KeyInfo }[];
  selectedKeyNum: string | null;
  onSelect: (keyNum: string) => void;
}

export const DropdownCell = ({ allKeys, selectedKeyNum, onSelect }: Props) => {
  const [search, setSearch] = useState('');
  const key = `${crypto.randomUUID()}`; // stable key for search box

  const filtered = allKeys.filter(
    ({ info }) =>
      info.source_key.toLowerCase().includes(search.toLowerCase()) ||
      info.source_message.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <td className="px-4 py-3">
      <Select value={selectedKeyNum || ''} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select from all keys..." />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 border-b sticky top-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search keys..."
                value={search}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearch(e.target.value);
                }}
                className="pl-8"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">No keys found</div>
            ) : (
              filtered.map(({ keyNum, info }) => (
                <SelectItem key={keyNum} value={keyNum}>
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{info.source_key}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {info.source_message} | Score: {info.final_score.toFixed(3)}
                      </div>
                    </div>
                    <Info className={cn('w-4 h-4', getScoreColor(info.final_score, 0.4, 0.8))} />
                  </div>
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </td>
  );
};