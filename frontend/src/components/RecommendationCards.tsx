import { useState } from "react";
import type { RecommendResponse } from "../types";

interface Props {
  recommendation: RecommendResponse;
}

interface CardProps {
  label: string;
  value: string | number;
  hint: string;
  tooltip: string;
}

function Card({ label, value, hint, tooltip }: CardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center text-center shadow-sm cursor-help hover:border-gray-300 hover:shadow transition-all"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-gray-900 mt-1">
        {value}
      </span>
      <span className="text-xs text-gray-500 mt-2 leading-tight">
        {hint}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="font-medium mb-1">{label}</div>
          <div className="text-gray-300 leading-relaxed">{tooltip}</div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default function RecommendationCards({ recommendation }: Props) {
  const { model_info, instance_info } = recommendation;

  const paramB = (model_info.parameter_count / 1e9).toFixed(1);
  const modelSummary = `${model_info.architecture.toUpperCase()} ${paramB}B`;
  const instanceSummary = `${instance_info.accelerator_count}x ${instance_info.accelerator_name}`;

  // Format context length nicely (e.g., 32768 -> "32K")
  const formatContext = (len: number) => {
    if (len >= 1000) {
      return `${(len / 1024).toFixed(0)}K`;
    }
    return len.toLocaleString();
  };

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="font-medium text-green-800">Configuration Ready</span>
      </div>

      {/* Model → Instance summary */}
      <div className="text-sm text-green-700 mb-4 flex items-center gap-2 flex-wrap">
        <span className="font-medium">{modelSummary}</span>
        <span className="text-green-600">({model_info.native_dtype})</span>
        {model_info.sliding_window && model_info.sliding_window > 0 && (
          <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded" title="KV cache capped at window size for efficient memory usage">
            {(model_info.sliding_window / 1024).toFixed(0)}K window
          </span>
        )}
        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
        <span className="font-medium">{instanceSummary}</span>
        <span className="text-green-600">({instance_info.accelerator_memory_gib} GiB)</span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card
          label="Tensor Parallel"
          value={recommendation.tensor_parallel_degree}
          hint={recommendation.tensor_parallel_degree === instance_info.accelerator_count
            ? "All GPUs"
            : `${recommendation.tensor_parallel_degree} of ${instance_info.accelerator_count} GPUs`}
          tooltip={recommendation.explanation.tensor_parallel_degree}
        />
        <Card
          label="Quantization"
          value={recommendation.quantization ?? "None"}
          hint={recommendation.quantization
            ? `${recommendation.quantization.toUpperCase()} precision`
            : `Native ${model_info.native_dtype}`}
          tooltip={recommendation.explanation.quantization}
        />
        <Card
          label="Max Context"
          value={formatContext(recommendation.max_model_len)}
          hint={`${recommendation.max_model_len.toLocaleString()} tokens`}
          tooltip={recommendation.explanation.max_model_len}
        />
        <Card
          label="Concurrency"
          value={recommendation.concurrency}
          hint="Parallel requests"
          tooltip={recommendation.explanation.concurrency}
        />
        <Card
          label="Overhead"
          value={`${recommendation.overhead_gib.toFixed(1)}G`}
          hint="CUDA + graphs"
          tooltip={`Runtime overhead of ${recommendation.overhead_gib.toFixed(2)} GiB reserved for CUDA context, CUDA graph captures, and PyTorch allocator fragmentation. Increase this if the model fails with OOM errors.`}
        />
        <Card
          label="Sequence"
          value={`${recommendation.input_sequence_length}→${recommendation.output_sequence_length}`}
          hint="Input → Output"
          tooltip={`Input sequence length: ${recommendation.input_sequence_length} tokens. Output sequence length: ${recommendation.output_sequence_length} tokens. These are scaled based on the available context window to provide realistic workloads.`}
        />
      </div>
    </div>
  );
}
