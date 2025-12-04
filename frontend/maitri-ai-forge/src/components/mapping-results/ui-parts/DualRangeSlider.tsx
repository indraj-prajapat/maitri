import { getScoreColor } from '../utils/scoreColors';
import { useColorThresholds } from '../hooks/useColorThresholds';

interface Props {
  thresholds: ReturnType<typeof useColorThresholds>;
}

export const DualRangeSlider = ({ thresholds }: Props) => {
  const { low, high, setLow, setHigh } = thresholds;

  return (
    <div className="mt-0 px-3 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-border text-center">
      <div className="mb-0 flex flex-col">
        <h5 className="text-sm font-semibold text-foreground mb-1">Color Thresholds</h5>
        <p className="text-xs text-muted-foreground">Drag the handles to adjust score color indicators</p>
      </div>

      <div className="space-y-0">
        <div className="flex items-center justify-between mb-0">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-0 rounded">{low.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0 rounded">{high.toFixed(2)}</span>
          </div>
        </div>

        <div className="relative h-3 flex items-center">
          <div className="absolute w-full h-1 bg-gradient-to-r from-red-300 to-green-300 rounded-lg" />
          <div
            className="absolute h-1 bg-yellow-400 rounded-xs"
            style={{ left: `${low * 100}%`, right: `${100 - high * 100}%` }}
          />
          {/* low thumb */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={low}
            onChange={(e) => setLow(parseFloat(e.target.value))}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-yellow-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
          />
          {/* high thumb */}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={high}
            onChange={(e) => setHigh(parseFloat(e.target.value))}
            className="absolute w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        <div className="flex justify-between text-xs text-muted-foreground mt-1 px-1">
          <span>0.00</span>
          <span>1.00</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 pt-0 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-xs text-muted-foreground">&lt; {low.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">{low.toFixed(2)} - {high.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-xs text-muted-foreground">≥ {high.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};