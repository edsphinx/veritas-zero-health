/**
 * TagSelect Component
 *
 * A select dropdown that displays selected values as removable tags/badges
 * Similar to bk_nextjs implementation for better UX
 *
 * Features:
 * - Dropdown with predefined options
 * - Selected items shown as tags with X button
 * - Support for custom colors (primary, destructive, etc.)
 */

'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagSelectOption {
  value: string;
  label: string;
}

interface TagSelectProps {
  options: TagSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  variant?: 'default' | 'primary' | 'destructive' | 'success';
  disabled?: boolean;
  className?: string;
}

export function TagSelect({
  options,
  value = [],
  onChange,
  placeholder = '-- Select to add --',
  variant = 'default',
  disabled = false,
  className = '',
}: TagSelectProps) {
  const handleSelect = (selectedValue: string) => {
    if (selectedValue && !value.includes(selectedValue)) {
      onChange([...value, selectedValue]);
    }
  };

  const handleRemove = (valueToRemove: string) => {
    onChange(value.filter((v) => v !== valueToRemove));
  };

  const variantStyles = {
    default: 'bg-muted text-muted-foreground',
    primary: 'bg-primary/10 text-primary',
    destructive: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    success: 'bg-success/10 text-success',
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <select
        className="w-full px-3 py-2 text-sm rounded border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        onChange={(e) => {
          handleSelect(e.target.value);
          e.target.value = ''; // Reset select after selection
        }}
        disabled={disabled}
        defaultValue=""
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={value.includes(option.value)}
          >
            {option.label}
          </option>
        ))}
      </select>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((val) => {
            const option = options.find((opt) => opt.value === val);
            const label = option ? option.label : val;

            return (
              <Badge
                key={val}
                variant="outline"
                className={`${variantStyles[variant]} px-3 py-1 text-xs font-normal`}
              >
                <span>{label}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(val)}
                  disabled={disabled}
                  className="ml-2 hover:opacity-70 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Remove ${label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
