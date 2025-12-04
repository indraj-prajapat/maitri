import { MappingResult, KeyInfo } from '../types';

export interface PreviewRow {
  targetKey: string;
  sourceKey: string;
  info: KeyInfo | null;
}

export const usePreviewData = (
  results: MappingResult,
  selectedKeys: Record<string, string | null>
): PreviewRow[] => {
  const rows: PreviewRow[] = [];

  Object.entries(results).forEach(([msg, mappings]) => {
    Object.entries(mappings).forEach(([key, keySet]) => {
      const unique = `${msg}::${key}`;
      const selectedKeyNum = selectedKeys[unique];
      const info = selectedKeyNum ? keySet[selectedKeyNum as keyof typeof keySet] : null;

      rows.push({
        targetKey: `${msg}::${key}::${keySet.target_value ?? ''}`,
        sourceKey: info
          ? `${info.source_message}::${info.source_key}::${info.source_value ?? ''}`
          : 'None mapped',
        info: info ?? null,
      });
    });
  });
  return rows;
};