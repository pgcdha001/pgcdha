import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';

const AdvancedDataTable = ({
  data = [],
  columns = [],
  pageSize = 10,
  sortable = true,
  actionColumn = true,
  actions = [],
  onRowClick,
  onActionClick,
  loading = false,
  emptyMessage = "No data available",
  className = "",
  striped = true,
  hover = true
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());

  // Default actions
  const defaultActions = [
    {
      id: 'view',
      label: 'View',
      icon: Eye,
      color: 'text-blue-600',
      permission: 'view_details'
    },
    {
      id: 'edit',
      label: 'Edit',
      icon: Edit,
      color: 'text-green-600',
      permission: 'edit_records'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      color: 'text-red-600',
      permission: 'delete_records'
    }
  ];

  const availableActions = actions.length > 0 ? actions : defaultActions;

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentData = sortedData.slice(startIndex, endIndex);

  // Sorting handler
  const handleSort = (key) => {
    if (!sortable) return;

    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Row selection
  const handleRowSelect = (rowId, checked) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const allRowIds = currentData.map((row, index) => row.id || index);
      setSelectedRows(new Set(allRowIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderSortIcon = (columnKey) => {
    if (!sortable) return null;
    
    if (sortConfig.key !== columnKey) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }

    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />;
  };

  const renderCellContent = (row, column) => {
    const value = row[column.key];
    
    if (column.render) {
      return column.render(value, row);
    }

    if (column.type === 'date' && value) {
      return new Date(value).toLocaleDateString();
    }

    if (column.type === 'currency' && value !== null && value !== undefined) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }

    if (column.type === 'badge' && value) {
      const badgeConfig = column.badgeConfig?.[value] || {};
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badgeConfig.className || 'bg-gray-100 text-gray-800'
        }`}>
          {badgeConfig.label || value}
        </span>
      );
    }

    return value !== null && value !== undefined ? String(value) : '-';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
      {/* Table Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Data Table ({sortedData.length} records)
            </h3>
            {selectedRows.size > 0 && (
              <p className="text-sm text-blue-600 mt-1">
                {selectedRows.size} row(s) selected
              </p>
            )}
          </div>
          
          {selectedRows.size > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Bulk Actions
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {sortedData.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-600">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === currentData.length && currentData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>

                  {/* Column Headers */}
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {sortable && column.sortable !== false && renderSortIcon(column.key)}
                      </div>
                    </th>
                  ))}

                  {/* Actions Column */}
                  {actionColumn && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              
              <tbody className={`divide-y divide-gray-200 ${striped ? 'divide-y' : ''}`}>
                {currentData.map((row, index) => {
                  const rowId = row.id || index;
                  const isSelected = selectedRows.has(rowId);
                  
                  return (
                    <tr
                      key={rowId}
                      className={`
                        ${hover ? 'hover:bg-gray-50' : ''}
                        ${striped && index % 2 === 1 ? 'bg-gray-25' : ''}
                        ${isSelected ? 'bg-blue-50' : ''}
                        ${onRowClick ? 'cursor-pointer' : ''}
                        transition-colors duration-150
                      `}
                      onClick={() => onRowClick?.(row)}
                    >
                      {/* Select Checkbox */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRowSelect(rowId, e.target.checked);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Data Cells */}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 whitespace-nowrap text-sm ${
                            column.className || 'text-gray-900'
                          }`}
                        >
                          {renderCellContent(row, column)}
                        </td>
                      ))}

                      {/* Actions Cell */}
                      {actionColumn && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-2">
                            {availableActions.map((action) => {
                              const Icon = action.icon;
                              
                              return (
                                <PermissionGuard
                                  key={action.id}
                                  permissions={action.permission ? [action.permission] : []}
                                  fallback={null}
                                >
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onActionClick?.(action.id, row);
                                    }}
                                    className={`p-1 rounded hover:bg-gray-100 ${action.color || 'text-gray-600'}`}
                                    title={action.label}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </button>
                                </PermissionGuard>
                              );
                            })}
                            
                            {availableActions.length > 3 && (
                              <button className="p-1 rounded hover:bg-gray-100 text-gray-600">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, sortedData.length)} of {sortedData.length} results
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdvancedDataTable;
