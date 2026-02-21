import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageNameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  files: File[];
  onSave: (messageNames: Record<string, string>) => void;
  existingNames?: Record<string, string>;
}

export const MessageNameDialog = ({ 
  isOpen, 
  onClose, 
  files, 
  onSave,
  existingNames = {}
}: MessageNameDialogProps) => {
  const [messageNames, setMessageNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initialNames: Record<string, string> = {};
      files.forEach(file => {
        const defaultMessageName = file.name.replace(/\.[^/.]+$/, '').replace(/\./g, '');
        initialNames[file.name] = existingNames[file.name] || defaultMessageName;
      });
      setMessageNames(initialNames);
    }
  }, [isOpen, files, existingNames]);


  const handleSave = () => {
    const allFilled = files.every(file => messageNames[file.name]?.trim());
    if (!allFilled) {
      return;
    }
    onSave(messageNames);
    onClose();
  };

  const allFilled = files.every(file => messageNames[file.name]?.trim());

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          Enter Message Names
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Please provide a message name for each uploaded file
        </DialogDescription>

        <ScrollArea className="flex-1 pr-4 overflow-y-scroll">
          <div className="space-y-4">
            {files.map((file, index) => {
              // Extract default message name (remove extension and dots)
              const defaultMessageName = file.name.replace(/\.[^/.]+$/, '').replace(/\./g, '');

              return (
                <div key={index} className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <p className="text-sm font-medium truncate flex-1">{file.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)}KB
                    </span>
                  </div>
                  <div>
                    <Label htmlFor={`message-${index}`} className="text-xs">
                      Message Name *
                    </Label>
                    <Input
                      id={`message-${index}`}
                      value={messageNames[file.name] || defaultMessageName}
                      onChange={(e) =>
                        setMessageNames({
                          ...messageNames,
                          [file.name]: e.target.value,
                        })
                      }
                      placeholder="Enter message name..."
                      className="mt-1"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>


        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
           
            className="flex-1 bg-gradient-to-r from-primary to-accent"
          >
            Save Message Names
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
