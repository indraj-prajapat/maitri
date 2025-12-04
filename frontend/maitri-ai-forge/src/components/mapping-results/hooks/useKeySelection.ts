import { useState, useEffect } from 'react';
import { MappingResult } from '../types';

export const useKeySelection = (
  results: MappingResult,
  isOpen: boolean,
  threshold: number
) => {
  const [selected, setSelected] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!isOpen || !Object.keys(results).length) return;

    const next: Record<string, string | null> = {};
    Object.entries(results).forEach(([msg, mappings]) => {
      Object.entries(mappings).forEach(([key, keySet]) => {
        const unique = `${msg}::${key}`;
        const key1 = keySet?.key1;
        next[unique] = key1 && key1.final_score >= threshold ? 'key1' : null;
      });
    });
    setSelected(next);
  }, [isOpen, results, threshold]);

  const select = (uniqueKey: string, keyNum: string | null) => {
    setSelected((s) => ({ ...s, [uniqueKey]: keyNum }));
  };

  return { selectedKeys: selected, select };
};