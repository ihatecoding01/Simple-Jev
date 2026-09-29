'use client';

import React, { useRef, useEffect } from 'react';

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
    <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-md bg-[#0A0A0A]/90 border-t border-[#2E2E32] px-4 py-3 sm:py-4">
      <div className="max-w-4xl mx-auto space-y-2">
        <div className="flex items-center bg-[#161618] border border-[#2E2E32] rounded-[4px] px-4 py-2 focus-within:border-[#C8FF00] focus-within:shadow-[0_0_16px_rgba(200,255,0,0.12)] transition-all">
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
          <button
            className="ml-2 w-9 h-9 rounded-[4px] bg-[#C8FF00] hover:bg-[#A3CC00] text-[#0A0A0A] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:shadow-[0_0_15px_rgba(200,255,0,0.2)] shrink-0 font-mono font-bold"
            onClick={() => {
              if (inputValue.trim() && !isProcessing) onSubmit(inputValue.trim());
            }}
            disabled={!inputValue.trim() || isProcessing}
            title="Evaluate with Jev"
            id="send-prompt-btn"
          >
            {isProcessing ? (
              <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black animate-spin rounded-[1px]" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
