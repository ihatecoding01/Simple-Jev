'use client';

import React from 'react';

interface Stage {
  stage: string;
  label: string;
  status?: string;
}

interface StepperProps {
  stages: Stage[];
}

export default function Stepper({ stages }: StepperProps) {
  if (!stages || stages.length === 0) return null;

  const currentStage = stages[stages.length - 1];

  return (
    <div
      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white border border-[#E5E5E2] text-xs text-[#374151] shadow-xs animate-pulse"
      id="pipeline-stepper"
    >
      <div className="w-3 h-3 border-2 border-[#5B61F6]/30 border-t-[#5B61F6] rounded-full animate-spin" />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-[#111111] font-mono text-[11px] uppercase tracking-wide">Pipeline:</span>
        <span className="text-xs">{currentStage.label || 'Evaluating intent...'}</span>
      </div>
    </div>
  );
}
