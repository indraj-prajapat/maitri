import { MappingResult, KeyInfo } from '../types';

export const buildCsv = (
  results: MappingResult,
  selectedKeys: Record<string, string | null>
) => {
  const rows: string[] = ['Target message,Target Key,Source message,Source Key'];

  Object.entries(results).forEach(([targetMessage, mappings]) => {
    Object.entries(mappings).forEach(([targetKey, keys]) => {
      const uniqueKey = `${targetMessage}::${targetKey}`;
      const selectedKeyNum = selectedKeys[uniqueKey];
      const info = selectedKeyNum ? keys[selectedKeyNum as keyof typeof keys] : null;

      rows.push([
        `"${targetMessage}"`,
        `"${targetKey}"`,
        info ? `"${info.source_message}"` : 'None mapped',
        info ? `"${info.source_key}"` : 'None mapped',
      ].join(','));
    });
  });
  return rows.join('\n');
};

export const downloadCsv = (csv: string, filename = 'approved_mapping.csv') => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};