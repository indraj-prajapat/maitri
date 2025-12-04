export interface KeyInfo {
  final_score: number;
  source_message: string;
  source_key: string;
  source_file: string;
  source_country: string;
  source_domain: string;
  source_system: string;
  source_value?: string;   // optional, used later
}

export interface MappingResult {
  [targetMessage: string]: {
    [targetKey: string]: {
      target_value?: string;
      key1?: KeyInfo;
      key2?: KeyInfo;
      key3?: KeyInfo;
    };
  };
}

export interface MappingResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: MappingResult;
  onApprove?: (approvedMappings: Array<{ targetKey: string; sourceKey: string }>) => void;
  scoreThreshold?: number;
}