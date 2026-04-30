import React from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled, className = "" }: CheckboxProps) {
  return (
    <label 
      className={`
        flex items-center gap-3 cursor-pointer group select-none 
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''} 
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
        />
        <div className={`
          w-5 h-5 rounded-[6px] border-2 transition-all duration-300 flex items-center justify-center
          ${checked 
            ? 'bg-primary border-primary shadow-lg shadow-primary/20' 
            : 'bg-muted/50 border-border group-hover:border-primary/40 group-hover:bg-muted'}
        `}>
          <svg
            className={`
              w-3.5 h-3.5 text-primary-foreground transition-all duration-300
              ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      {label && (
        <span className={`text-[0.95rem] transition-colors duration-200 ${checked ? 'text-foreground font-medium' : 'text-muted-foreground group-hover:text-foreground/70'}`}>
          {label}
        </span>
      )}
    </label>
  );
}
