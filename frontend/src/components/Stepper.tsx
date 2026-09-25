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
      className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 shadow-sm animate-pulse"
      id="pipeline-stepper"
    >
      <div className="w-3 h-3 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      <div className="flex items-center gap-1.5">
        <span className="font-semibold text-slate-100">Pipeline:</span>
        <span>{currentStage.label || 'Evaluating intent...'}</span>
      </div>
    </div>
  );
}
