import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Calendar, Users, BookOpen, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';

const AdvancedFilters = ({ 
  onFiltersChange, 
  availableFilters = [], 
  initialFilters = {},
  className = "",
  showQuickFilters = true,
  showDateRange = true,
  showSearch = true
}) => {
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all',
    quickFilter: 'all',
    customFilters: {},
    ...initialFilters
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);

  // Update active filter count
  useEffect(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.dateRange !== 'all') count++;
    if (filters.quickFilter !== 'all') count++;
    
    Object.values(filters.customFilters).forEach(value => {
      if (value && value !== 'all' && value !== '') count++;
    });
    
    setActiveFilterCount(count);
  }, [filters]);

  // Debounced filter change handler
  const debouncedOnFiltersChange = useCallback(
    debounce((newFilters) => {
      if (onFiltersChange) {
        onFiltersChange(newFilters);
      }
    }, 300),
    [onFiltersChange]
  );

  useEffect(() => {
    debouncedOnFiltersChange(filters);
  }, [filters, debouncedOnFiltersChange]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleCustomFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      customFilters: {
        ...prev.customFilters,
        [key]: value
      }
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      dateRange: 'all',
      quickFilter: 'all',
      customFilters: {}
    });
  };

  const clearFilter = (key, isCustom = false) => {
    if (isCustom) {
      setFilters(prev => ({
        ...prev,
        customFilters: {
          ...prev.customFilters,
          [key]: ''
        }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [key]: key === 'search' ? '' : 'all'
      }));
    }
  };

  // Quick filter presets
  const quickFilters = [
    { value: 'all', label: 'All Records', icon: Users },
    { value: 'recent', label: 'Recent (7 days)', icon: Calendar },
    { value: 'active', label: 'Active', icon: BookOpen },
    { value: 'pending', label: 'Pending', icon: Filter }
  ];

  // Date range options
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: 'custom', label: 'Custom Range' }
  ];

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFilterCount} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              onClick={() => setIsExpanded(!isExpanded)}
              variant="ghost"
              size="sm"
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Filters */}
      <div className="p-4 space-y-4">
        {/* Search */}
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {filters.search && (
              <button
                onClick={() => clearFilter('search')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Quick Filters */}
        {showQuickFilters && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = filters.quickFilter === filter.value;
                
                return (
                  <button
                    key={filter.value}
                    onClick={() => handleFilterChange('quickFilter', filter.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Basic Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range */}
          {showDateRange && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  {dateRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Custom Filters (first 2 when collapsed) */}
          {availableFilters.slice(0, isExpanded ? availableFilters.length : 2).map((filter) => (
            <CustomFilterControl
              key={filter.key}
              filter={filter}
              value={filters.customFilters[filter.key] || ''}
              onChange={(value) => handleCustomFilterChange(filter.key, value)}
              onClear={() => clearFilter(filter.key, true)}
            />
          ))}
        </div>

        {/* Expanded Filters */}
        {isExpanded && availableFilters.length > 2 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableFilters.slice(2).map((filter) => (
                <CustomFilterControl
                  key={filter.key}
                  filter={filter}
                  value={filters.customFilters[filter.key] || ''}
                  onChange={(value) => handleCustomFilterChange(filter.key, value)}
                  onClear={() => clearFilter(filter.key, true)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Filters Summary */}
        {activeFilterCount > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              
              {filters.search && (
                <FilterTag
                  label={`Search: "${filters.search}"`}
                  onRemove={() => clearFilter('search')}
                />
              )}
              
              {filters.dateRange !== 'all' && (
                <FilterTag
                  label={`Date: ${dateRangeOptions.find(opt => opt.value === filters.dateRange)?.label}`}
                  onRemove={() => clearFilter('dateRange')}
                />
              )}
              
              {filters.quickFilter !== 'all' && (
                <FilterTag
                  label={`Filter: ${quickFilters.find(qf => qf.value === filters.quickFilter)?.label}`}
                  onRemove={() => clearFilter('quickFilter')}
                />
              )}

              {Object.entries(filters.customFilters).map(([key, value]) => {
                if (!value || value === 'all' || value === '') return null;
                const filter = availableFilters.find(f => f.key === key);
                return (
                  <FilterTag
                    key={key}
                    label={`${filter?.label}: ${filter?.options?.find(opt => opt.value === value)?.label || value}`}
                    onRemove={() => clearFilter(key, true)}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Filter Control Component
const CustomFilterControl = ({ filter, value, onChange, onClear }) => {
  const renderFilterInput = () => {
    switch (filter.type) {
      case 'select':
        return (
          <div className="relative">
            {filter.icon && (
              <filter.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full ${filter.icon ? 'pl-10' : 'pl-3'} pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none`}
            >
              <option value="">All {filter.label}</option>
              {filter.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {value && (
              <button
                onClick={onClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="relative">
            {filter.icon && (
              <filter.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <input
              type="text"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full ${filter.icon ? 'pl-10' : 'pl-3'} pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {value && (
              <button
                onClick={onClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );

      case 'number':
        return (
          <div className="relative">
            {filter.icon && (
              <filter.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            )}
            <input
              type="number"
              placeholder={filter.placeholder || `Enter ${filter.label.toLowerCase()}...`}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              min={filter.min}
              max={filter.max}
              className={`w-full ${filter.icon ? 'pl-10' : 'pl-3'} pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            />
            {value && (
              <button
                onClick={onClear}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {filter.label}
      </label>
      {renderFilterInput()}
    </div>
  );
};

// Filter Tag Component
const FilterTag = ({ label, onRemove }) => (
  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
    {label}
    <button
      onClick={onRemove}
      className="text-blue-600 hover:text-blue-800"
    >
      <X className="h-3 w-3" />
    </button>
  </span>
);

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default AdvancedFilters;
