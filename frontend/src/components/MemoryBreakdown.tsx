import type { MemoryBreakdownResponse } from "../types";

interface Props {
  breakdown: MemoryBreakdownResponse | null;
  loading?: boolean;
}

const COLORS = {
  model_weights: "#3b82f6", // blue
  kv_cache: "#10b981", // green
  runtime_overhead: "#f59e0b", // amber
  quantization_metadata: "#8b5cf6", // purple
  block_table: "#ec4899", // pink
  headroom: "#e5e7eb", // gray-200
};

export default function MemoryBreakdown({ breakdown, loading }: Props) {
  if (!breakdown) {
    return null;
  }

  const total = breakdown.total_available_gib;
  const segments = [
    { label: "Model Weights", value: breakdown.model_weights_gib, color: COLORS.model_weights },
    { label: "KV Cache", value: breakdown.kv_cache_gib, color: COLORS.kv_cache },
    { label: "Runtime Overhead", value: breakdown.runtime_overhead_gib, color: COLORS.runtime_overhead },
    { label: "Quant Metadata", value: breakdown.quantization_metadata_gib, color: COLORS.quantization_metadata },
    { label: "Block Tables", value: breakdown.block_table_gib, color: COLORS.block_table },
    { label: "Headroom", value: breakdown.headroom_gib, color: COLORS.headroom },
  ].filter(s => s.value > 0.01); // Filter out negligible segments

  return (
    <div className="rounded-md border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Memory Breakdown</h3>
        {loading && (
          <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
      </div>

      {/* Stacked bar visualization */}
      <div className="relative h-8 rounded-md overflow-hidden bg-gray-100 mb-3">
        {segments.map((seg, i) => {
          const pct = (seg.value / total) * 100;
          const offset = segments.slice(0, i).reduce((acc, s) => acc + (s.value / total) * 100, 0);
          return (
            <div
              key={seg.label}
              className="absolute top-0 h-full transition-all duration-300"
              style={{
                left: `${offset}%`,
                width: `${pct}%`,
                backgroundColor: seg.color,
              }}
              title={`${seg.label}: ${seg.value.toFixed(2)} GiB (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-gray-600">{seg.label}:</span>
            <span className="text-gray-900 font-medium">{seg.value.toFixed(2)} GiB</span>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs">
        <span className="text-gray-500">
          Total Used: <span className="font-medium text-gray-700">{breakdown.total_used_gib.toFixed(2)} GiB</span>
        </span>
        <span className="text-gray-500">
          Available: <span className="font-medium text-gray-700">{breakdown.total_available_gib.toFixed(2)} GiB</span>
        </span>
      </div>

      {/* Warning */}
      {breakdown.warning_message && (
        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
          {breakdown.warning_message}
        </div>
      )}
    </div>
  );
}
