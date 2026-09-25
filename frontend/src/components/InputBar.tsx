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
    <div className="fixed bottom-0 left-0 right-0 z-30 backdrop-blur-lg bg-slate-950/80 border-t border-slate-800/80 px-4 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto space-y-2">
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2 shadow-2xl focus-within:border-indigo-500 transition-all">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || 'Ask a plain-language question or paste text to evaluate...'}
            className="flex-1 bg-transparent border-none outline-none text-slate-100 text-sm sm:text-base resize-none max-h-32 min-h-[26px] placeholder:text-slate-500 leading-normal"
            disabled={isProcessing}
            id="main-prompt-input"
          />
          <button
            className="ml-2 w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 hover:scale-105 active:scale-95 shrink-0"
            onClick={() => {
              if (inputValue.trim() && !isProcessing) onSubmit(inputValue.trim());
            }}
            disabled={!inputValue.trim() || isProcessing}
            title="Evaluate with Jev"
            id="send-prompt-btn"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
