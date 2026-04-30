import React, { useState } from 'react';

export interface CountryCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  length: number;
}

export const COUNTRY_CODES: CountryCode[] = [
  { code: 'IN', dialCode: '+91', name: 'India', flag: '🇮🇳', length: 10 },
  { code: 'US', dialCode: '+1', name: 'United States', flag: '🇺🇸', length: 10 },
  { code: 'GB', dialCode: '+44', name: 'United Kingdom', flag: '🇬🇧', length: 10 },
  { code: 'AE', dialCode: '+971', name: 'UAE', flag: '🇦🇪', length: 9 },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  selectedCountry: CountryCode;
  onCountryChange: (country: CountryCode) => void;
  error?: string;
  className?: string;
}

export function PhoneInput({ 
  value, 
  onChange, 
  selectedCountry, 
  onCountryChange, 
  error, 
  className = "" 
}: PhoneInputProps) {
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/\D/g, '');
    if (num.length <= selectedCountry.length) {
      onChange(num);
    }
  };

  return (
    <div className={`
      flex items-center gap-2 px-3 rounded-xl bg-muted/50 border transition-all duration-200
      ${error ? 'border-red-500/40' : 'border-border'} 
      focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10
      ${className}
    `}>
      <select 
        className="bg-transparent py-2.5 text-sm border-none outline-none cursor-pointer pr-1"
        value={selectedCountry.code}
        onChange={(e) => {
          const country = COUNTRY_CODES.find(c => c.code === e.target.value)!;
          onCountryChange(country);
        }}
      >
        {COUNTRY_CODES.map(c => (
          <option key={c.code} value={c.code} className="bg-card text-foreground">{c.flag} {c.dialCode}</option>
        ))}
      </select>
      <div className="w-px h-4 bg-border shrink-0" />
      <input
        type="tel"
        value={value}
        onChange={handleNumberChange}
        className="flex-1 bg-transparent py-2.5 border-none outline-none text-foreground text-sm placeholder-foreground/20"
        placeholder={`Enter ${selectedCountry.length} digits`}
      />
    </div>
  );
}
