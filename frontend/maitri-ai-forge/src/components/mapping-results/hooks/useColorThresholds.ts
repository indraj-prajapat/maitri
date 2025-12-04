import { useState } from 'react';

export const useColorThresholds = (initialLow = 0.4, initialHigh = 0.8) => {
  const [low, setLow] = useState(initialLow);
  const [high, setHigh] = useState(initialHigh);

  const handleLow = (v: number) => {
    if (v < high - 0.1) setLow(v);
  };
  const handleHigh = (v: number) => {
    if (v > low + 0.1) setHigh(v);
  };

  return { low, high, setLow: handleLow, setHigh: handleHigh };
};