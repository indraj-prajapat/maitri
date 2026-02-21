import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { UploadSectionData } from './UploadSection';
import { Loader2, CheckCircle2, FileText, MapPin, Ship, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  leftData: UploadSectionData;
  rightData: UploadSectionData;
}

export const MetadataModal = ({ isOpen, onClose, leftData, rightData }: MetadataModalProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsAnalyzing(true);
      setProgress(0);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setIsAnalyzing(false), 500);
            return 100;
          }
          return prev + 1;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const renderMetadataCard = (title: string, data: UploadSectionData) => (
    <div className="bg-card border border-border rounded-lg p-6 space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Ship className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Domain</p>
            <p className="text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full" />
              {data.domain}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Country</p>
            <p className="text-sm font-medium flex items-center gap-2">
              <MapPin className="w-3 h-3 text-accent" />
              {data.country}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Port / Station</p>
          <p className="text-sm font-medium">{data.portStation}</p>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Files ({data.files.length})</p>
          </div>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {data.files.map((file, index) => (
                <div key={index} className="space-y-1">
                  <div className="text-xs bg-muted/50 p-2 rounded flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                    <span className="flex-1 truncate">{file.name}</span>
                    <span className="text-muted-foreground">
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                  </div>
                  <div className="text-xs bg-primary/5 p-2 rounded ml-4">
                    <p className="text-muted-foreground italic">
                      Transport document containing shipment details and logistics information for {data.domain} transport via {data.portStation}.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          MATRI AI Analysis
        </DialogTitle>

        <div className="flex-1 overflow-y-auto">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-primary animate-spin" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent opacity-20 blur-xl animate-pulse" />
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl font-semibold">Analyzing Transport Data</h3>
                <p className="text-sm text-muted-foreground">
                  Matching logistics information across networks...
                </p>
              </div>

              <div className="w-full max-w-md space-y-2">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">{progress}%</p>
              </div>

              <div className="grid grid-cols-3 gap-4 w-full max-w-md pt-4">
                {[
                  { label: 'Scanning Files', done: progress > 30 },
                  { label: 'Matching Routes', done: progress > 60 },
                  { label: 'Validating Data', done: progress > 90 },
                ].map((step, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                      step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {step.done ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 bg-current rounded-full" />}
                    </div>
                    <p className="text-xs text-center">{step.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                <div>
                  <p className="font-semibold">Analysis Complete</p>
                  <p className="text-sm text-muted-foreground">
                    Successfully matched transport data between source and target
                  </p>
                </div>
              </div>

              {/* Visual Mapping */}
              <div className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 rounded-lg p-6 border border-primary/20">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-2 shadow-lg">
                      <Ship className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-sm">{leftData.portStation}</p>
                    <p className="text-xs text-muted-foreground">{leftData.country}</p>
                  </div>
                  
                  <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-full">
                      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary rounded-full animate-pulse" />
                      <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary bg-background rounded-full p-1.5 shadow-lg" />
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent text-accent-foreground mb-2 shadow-lg">
                      <MapPin className="w-8 h-8" />
                    </div>
                    <p className="font-semibold text-sm">{rightData.portStation}</p>
                    <p className="text-xs text-muted-foreground">{rightData.country}</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm font-medium bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    {leftData.domain} Transport Route Mapped
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {renderMetadataCard("Source Data", leftData)}
                {renderMetadataCard("Target Data", rightData)}
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg"
                  onClick={onClose}
                >
                  Preview Mapping
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
