import { useState, useEffect } from 'react';
import { FileUploadZone } from './FileUploadZone';
import { MessageNameDialog } from './MessageNameDialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DOMAINS, COUNTRIES, TRANSPORT_DATA, Domain, DOMAIN_LABELS, LOCATION_DETAILS } from '@/data/newTransportData';
import { cn } from '@/lib/utils';

export interface UploadSectionData {
  files: File[];
  domain: Domain | null;
  country: string | null;
  portStation: string | null;
  location: string | null;
  messageNames: Record<string, string>;
}

interface UploadSectionProps {
  title: string;
  data: UploadSectionData;
  onChange: (data: UploadSectionData) => void;
  showErrors: boolean;
}

export const UploadSection = ({ title, data, onChange, showErrors }: UploadSectionProps) => {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const availablePortsStations = data.country && data.domain
    ? TRANSPORT_DATA[data.country as keyof typeof TRANSPORT_DATA]?.[data.domain] || []
    : [];
  const availableLocationDetails = data.portStation
    ? LOCATION_DETAILS[data.portStation] || []
    : [];

  const hasFileError = showErrors && data.files.length === 0;
  const hasDomainError = showErrors && !data.domain;
  const hasCountryError = showErrors && !data.country;
  const hasPortStationError = showErrors && !data.portStation;
  const hasLocationError = showErrors && !data.location;

  useEffect(() => {
    if (pendingFiles.length > 0) {
      setIsMessageDialogOpen(true);
    }
  }, [pendingFiles]);

  const handleFilesChange = (files: File[]) => {
    setPendingFiles(files);
  };

  const handleMessageNamesSave = (messageNames: Record<string, string>) => {
    onChange({ ...data, files: pendingFiles, messageNames });
    setPendingFiles([]);
  };

  return (
    <div className="flex flex-col h-full p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-1 w-12 bg-gradient-to-r from-primary to-accent rounded-full" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          {title}
        </h2>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* File Upload */}
        <div>
          <Label className={cn(hasFileError && "text-destructive")}>
            Upload Files {hasFileError && <span className="text-xs ml-2">(Required)</span>}
          </Label>
          <div className="mt-2">
            <FileUploadZone
              files={data.files}
              onFilesChange={handleFilesChange}
              hasError={hasFileError}
            />
          </div>
        </div>

        {/* Message Name Dialog */}
        <MessageNameDialog
          isOpen={isMessageDialogOpen}
          onClose={() => {
            setIsMessageDialogOpen(false);
            setPendingFiles([]);
          }}
          files={pendingFiles}
          onSave={handleMessageNamesSave}
          existingNames={data.messageNames}
        />

        {/* Domain Selection */}
        <div>
          <Label className={cn(hasDomainError && "text-destructive")}>
            Domain {hasDomainError && <span className="text-xs ml-2">(Required)</span>}
          </Label>
          <Select
            value={data.domain || undefined}
            onValueChange={(value) => onChange({ ...data, domain: value as Domain, portStation: null, location: null })}
          >
            <SelectTrigger className={cn(
              "mt-2 transition-all duration-200",
              hasDomainError && "border-destructive focus:ring-destructive"
            )}>
              <SelectValue placeholder="Select domain..." />
            </SelectTrigger>
            <SelectContent>
              {DOMAINS.map((domain) => (
                <SelectItem key={domain} value={domain}>
                  {domain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country Selection */}
        <div>
          <Label className={cn(hasCountryError && "text-destructive")}>
            Country {hasCountryError && <span className="text-xs ml-2">(Required)</span>}
          </Label>
          <Select
            value={data.country || undefined}
            onValueChange={(value) => onChange({ ...data, country: value, portStation: null, location: null })}
          >
            <SelectTrigger className={cn(
              "mt-2 transition-all duration-200",
              hasCountryError && "border-destructive focus:ring-destructive"
            )}>
              <SelectValue placeholder="Select country..." />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Port/Station Selection */}
        <div>
          <Label className={cn(hasPortStationError && "text-destructive")}>
            Port {hasPortStationError && <span className="text-xs ml-2">(Required)</span>}
          </Label>
          <Select
            value={data.portStation || undefined}
            onValueChange={(value) => onChange({ ...data, portStation: value, location: null })}
            disabled={!data.country || !data.domain}
          >
            <SelectTrigger className={cn(
              "mt-2 transition-all duration-200",
              hasPortStationError && "border-destructive focus:ring-destructive",
              (!data.country || !data.domain) && "opacity-50 cursor-not-allowed"
            )}>
              <SelectValue placeholder={
                !data.country || !data.domain
                  ? "Select domain and country first..."
                  : "Select port/station..."
              } />
            </SelectTrigger>
            <SelectContent>
              {availablePortsStations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* Location Detail Selection */}
        <div>
          <Label className={cn(hasLocationError && "text-destructive")}>
            {(data.domain && DOMAIN_LABELS[data.domain]?.detail) || "Location Detail"} {hasLocationError && <span className="text-xs ml-2">(Required)</span>}
          </Label>
          <Select
            value={data.location || undefined}
            onValueChange={(value) => onChange({ ...data, location: value })}
            disabled={!data.portStation}
          >
            <SelectTrigger className={cn(
              "mt-2 transition-all duration-200",
              hasLocationError && "border-destructive focus:ring-destructive",
              (!data.portStation) && "opacity-50 cursor-not-allowed"
            )}>
              <SelectValue placeholder={
                !data.portStation
                  ? "Select port/station first..."
                  : `Select ${(data.domain && DOMAIN_LABELS[data.domain]?.detail) || "detail"}...`
              } />
            </SelectTrigger>
            <SelectContent>
              {availableLocationDetails.map((detail) => (
                <SelectItem key={detail} value={detail}>
                  {detail}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
