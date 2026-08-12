import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  label?: string;
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  className?: string;
  required?: boolean;
  placeholder?: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  dateFormat?: string;
}

export default function DatePickerComponent({ 
  label, 
  selected, 
  onChange, 
  className = '', 
  required = false,
  placeholder = 'Select date',
  minDate,
  maxDate,
  dateFormat = 'yyyy-MM-dd',
}: DatePickerProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <DatePicker
        selected={selected}
        onChange={onChange}
        placeholderText={placeholder}
        className={`block w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-coin-500 focus:outline-none focus:ring-1 focus:ring-coin-500 ${className}`}
        dateFormat={dateFormat}
        minDate={minDate || undefined}
        maxDate={maxDate || undefined}
      />
    </div>
  );
}
