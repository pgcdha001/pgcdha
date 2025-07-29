import React from 'react';
import { Search, Filter, User, Users } from 'lucide-react';

/**
 * Correspondence-specific filters component
 * Includes type, gender, staff member, and search filters
 */
const CorrespondenceFilters = ({
  selectedType,
  selectedGender,
  selectedStaff,
  searchTerm,
  typeFilters,
  genderFilters,
  currentData,
  onTypeChange,
  onGenderChange,
  onStaffChange,
  onSearchChange,
  isLoading
}) => {
  // Extract staff members from current data
  const staffMembers = React.useMemo(() => {
    if (!currentData || !currentData.raw) return [];
    
    const uniqueStaff = [...new Set(
      currentData.raw.map(item => item.staffMember.name)
    )].sort();
    
    return [
      { value: 'all', label: 'All Staff Members' },
      ...uniqueStaff.map(name => ({ value: name, label: name }))
    ];
  }, [currentData]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-4">
      <div className="flex items-center space-x-2 mb-3">
        <Filter className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>
      
      {/* Search by Student */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search by Student Name
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Enter student name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correspondence Type
        </label>
        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          {typeFilters.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* Gender Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Student Gender
        </label>
        <select
          value={selectedGender}
          onChange={(e) => onGenderChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          {genderFilters.map(filter => (
            <option key={filter.value} value={filter.value}>
              {filter.label}
            </option>
          ))}
        </select>
      </div>

      {/* Staff Member Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Staff Member
        </label>
        <select
          value={selectedStaff}
          onChange={(e) => onStaffChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        >
          {staffMembers.map(staff => (
            <option key={staff.value} value={staff.value}>
              {staff.label}
            </option>
          ))}
        </select>
      </div>

      {/* Current Filter Summary */}
      {(selectedType !== 'all' || selectedGender !== 'all' || selectedStaff !== 'all' || searchTerm) && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Active Filters:</p>
          <div className="flex flex-wrap gap-2">
            {selectedType !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Type: {typeFilters.find(f => f.value === selectedType)?.label}
              </span>
            )}
            {selectedGender !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Gender: {genderFilters.find(f => f.value === selectedGender)?.label}
              </span>
            )}
            {selectedStaff !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Staff: {selectedStaff}
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                Search: "{searchTerm}"
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CorrespondenceFilters;
