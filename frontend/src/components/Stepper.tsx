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
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[2px] bg-[#161618] border border-[#2E2E32] text-xs text-[#A1A1AA] shadow-[0_0_12px_rgba(139,92,246,0.12)]"
      id="pipeline-stepper"
    >
      <div className="w-2.5 h-2.5 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] animate-spin rounded-[1px]" />
      <div className="flex items-center gap-2">
        <span className="font-semibold text-[#8B5CF6] font-mono text-[10px] uppercase tracking-wider">
          WORKING:
        </span>
        <span className="text-xs font-mono text-white">{currentStage.label || 'Evaluating intent...'}</span>
      </div>
    </div>
  );
}
