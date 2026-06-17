import { Minus, Plus } from 'lucide-react';
import { cn } from '@/common/utils/cn';

interface StepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function Stepper({ value, onChange, min = 0, max }: StepperProps) {
  const atMin = value <= min;
  const atMax = max !== undefined && value >= max;
  const display = value > 0 ? `+${value}` : String(value);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={atMin}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Minus size={14} />
      </button>
      <span
        className={cn(
          'font-mono text-[18px] font-semibold w-12 text-center tabular-nums',
          value > 0 ? 'text-success-700' : value < 0 ? 'text-danger-700' : 'text-ink-900'
        )}
      >
        {display}
      </span>
      <button
        onClick={() => onChange(atMax ? value : value + 1)}
        disabled={atMax}
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-ink-700 hover:bg-sand-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
