'use client';

import React, { useRef, useEffect } from 'react';
import { DotCluster } from './AbstractGeometry';
import { IconSendDecision, IconScannerReticle } from './CyberIcons';

interface InputBarProps {
  inputValue: string;
  setInputValue: (val: string) => void;
  onSubmit: (val: string) => void;
  isProcessing: boolean;
  placeholder?: string;
}

export default function InputBar({
  inputValue,
  setInputValue,
  onSubmit,
  isProcessing,
  placeholder,
}: InputBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isProcessing) {
        onSubmit(inputValue.trim());
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-[#050505]/95 border-t border-[#27272B] px-4 py-3 sm:py-4">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center bg-[#141416] border border-[#27272B] rounded-[4px] px-3 sm:px-4 py-2 focus-within:border-[#C8FF00] focus-within:shadow-[0_0_20px_rgba(200,255,0,0.18)] transition-all">
          <div className="mr-2 text-[#C8FF00] opacity-70">
            <IconScannerReticle size={18} color="#C8FF00" />
          </div>
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Ask a plain-language question or paste text to evaluate...'}
            className="flex-1 bg-transparent border-none outline-none text-[#FFFFFF] text-sm resize-none max-h-32 min-h-[26px] placeholder:text-[#52525B] leading-normal font-sans"
            disabled={isProcessing}
            id="main-prompt-input"
          />
          {/* Crimson Red high-importance execute button */}
          <button
            className="ml-2 w-9 h-9 rounded-[4px] bg-[#FF2E54] hover:bg-[#E01B42] text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_18px_rgba(255,46,84,0.4)] hover:shadow-[0_0_26px_rgba(255,46,84,0.65)] hover:scale-105 active:scale-95 shrink-0 font-mono font-bold"
            onClick={() => {
              if (inputValue.trim() && !isProcessing) onSubmit(inputValue.trim());
            }}
            disabled={!inputValue.trim() || isProcessing}
            title="Evaluate with Jev"
            id="send-prompt-btn"
          >
            {isProcessing ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white animate-spin rounded-[1px]" />
            ) : (
              <IconSendDecision size={16} color="#FFFFFF" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
