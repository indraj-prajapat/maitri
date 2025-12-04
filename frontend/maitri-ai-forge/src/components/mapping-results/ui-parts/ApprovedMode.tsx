import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  rows: { targetKey: string; sourceKey: string }[];
  onDownload: () => void;
}

export const ApprovedMode = ({ rows, onDownload }: Props) => (
  <div className="flex flex-col h-full">
    <ScrollArea className="flex-1 mt-4 pr-4 overflow-y-auto overflow-x-scroll">
      <table className="w-full border-collapse border-2 border-border rounded-lg overflow-hidden shadow-lg">
        <thead>
          <tr className="bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20">
            <th className="px-6 py-4 text-left font-bold border-r-2 border-border w-1/2 text-primary">Target Key</th>
            <th className="px-6 py-4 text-left font-bold w-1/2 text-accent">Source Key</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={cn('border-t-2 border-border transition-all hover:bg-muted/50', i % 2 === 0 ? 'bg-card' : 'bg-muted/20')}
            >
              <td className="px-6 py-4 font-semibold border-r-2 border-border">{r.targetKey}</td>
              <td className="px-6 py-4 font-semibold">{r.sourceKey}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>

    <div className="flex justify-center pt-4 border-t">
      <Button size="lg" onClick={onDownload} className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
        <CheckCircle className="w-5 h-5 mr-2" /> Download as CSV
      </Button>
    </div>
  </div>
);