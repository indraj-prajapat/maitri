export const getScoreColor = (score: number, low: number, high: number) => {
  if (score >= high) return 'text-green-500';
  if (score >= low) return 'text-yellow-500';
  return 'text-red-500';
};

export const getScoreBgColor = (score: number, low: number, high: number) => {
  if (score >= high) return 'bg-green-50';
  if (score >= low) return 'bg-yellow-50';
  return 'bg-red-50';
};