import React from 'react';
import { CalendarDays, Clock } from 'lucide-react';

const DateFilter = ({ selectedDate, dateFilters, onDateChange, loading }) => {
  return (
    <div className="relative group">
      <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
      <select
        value={selectedDate}
        onChange={(e) => onDateChange(e.target.value)}
        disabled={loading}
        className="w-full pl-10 pr-4 py-3 bg-white/80 shadow-inner focus:shadow-lg focus:bg-white rounded-xl font-[Inter,sans-serif] focus:ring-2 focus:ring-primary/40 focus:outline-none appearance-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {dateFilters.map((filter) => (
          <option key={filter.value} value={filter.value}>
            {filter.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DateFilter;
