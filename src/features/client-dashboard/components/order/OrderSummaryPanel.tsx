import { Send } from 'lucide-react';
import { CardShell } from '@/features/dashboard/components/CardShell';

interface OrderSummaryPanelProps {
  totalItems: number;
  totalUnits: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  labels: {
    summaryTitle: string;
    totalItems: string;
    totalUnits: string;
    itemsUnit: string;
    unitsUnit: string;
    submitBtn: string;
  };
}

export function OrderSummaryPanel({
  totalItems,
  totalUnits,
  isSubmitting,
  onSubmit,
  labels,
}: OrderSummaryPanelProps) {
  return (
    <CardShell title={labels.summaryTitle}>
      <div className="flex flex-col gap-5">
        <div>
          <div className="flex items-center justify-between py-2.5 border-b border-border">
            <span className="text-[13px] text-ink-500">{labels.totalItems}</span>
            <span className="font-mono text-[14px] font-semibold text-ink-900">
              {totalItems} {labels.itemsUnit}
            </span>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-ink-500">{labels.totalUnits}</span>
            <span className="font-mono text-[14px] font-semibold text-ink-900">
              {totalUnits} {labels.unitsUnit}
            </span>
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-amber-600 text-white text-[14px] font-semibold hover:bg-amber-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          {labels.submitBtn}
        </button>
      </div>
    </CardShell>
  );
}
