import React, { useState } from 'react';
import { Download, FileText, Table, Image, Calendar, Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import PermissionGuard from '../PermissionGuard';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const EnhancedExportControls = ({ 
  data = [], 
  fileName = 'export',
  className = "",
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExport, setLastExport] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'excel',
    includeHeaders: true,
    includeTimestamp: true,
    includeFilters: false,
    customFields: [],
    dateFormat: 'MM/DD/YYYY'
  });

  // Available export formats
  const exportFormats = [
    {
      id: 'excel',
      name: 'Excel Spreadsheet',
      icon: Table,
      extension: 'xlsx',
      description: 'Best for data analysis and calculations',
      color: 'text-green-600'
    },
    {
      id: 'pdf',
      name: 'PDF Document',
      icon: FileText,
      extension: 'pdf',
      description: 'Best for sharing and printing',
      color: 'text-red-600'
    },
    {
      id: 'csv',
      name: 'CSV File',
      icon: Table,
      extension: 'csv',
      description: 'Universal format for data import',
      color: 'text-blue-600'
    }
  ];

  // Simulate export progress
  const simulateProgress = () => {
    return new Promise((resolve) => {
      setExportProgress(0);
      const interval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            resolve();
            return 100;
          }
          return prev + Math.random() * 30;
        });
      }, 200);
    });
  };

  // Export to Excel
  const exportToExcel = async () => {
    try {
      await simulateProgress();
      
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      
      // Add metadata if enabled
      if (exportOptions.includeTimestamp) {
        const metaData = [
          { '': `Generated on: ${new Date().toLocaleString()}` },
          { '': `Total Records: ${data.length}` },
          { '': '' } // Empty row
        ];
        
        const metaSheet = XLSX.utils.json_to_sheet(metaData, { skipHeader: true });
        XLSX.utils.book_append_sheet(workbook, metaSheet, 'Export Info');
      }
      
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      
      const finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, finalFileName);
      
      return { success: true, fileName: finalFileName };
    } catch (error) {
      throw new Error(`Excel export failed: ${error.message}`);
    }
  };

  // Export to PDF
  const exportToPDF = async () => {
    try {
      await simulateProgress();
      
      const doc = new jsPDF();
      
      // Add header
      doc.setFontSize(18);
      doc.text('Data Export Report', 14, 22);
      
      if (exportOptions.includeTimestamp) {
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
        doc.text(`Total Records: ${data.length}`, 14, 36);
      }
      
      // Prepare table data
      if (data.length > 0) {
        const headers = Object.keys(data[0]);
        const tableData = data.map(row => headers.map(header => row[header] || ''));
        
        autoTable(doc, {
          head: [headers],
          body: tableData,
          startY: exportOptions.includeTimestamp ? 45 : 30,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      }
      
      const finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(finalFileName);
      
      return { success: true, fileName: finalFileName };
    } catch (error) {
      throw new Error(`PDF export failed: ${error.message}`);
    }
  };

  // Export to CSV
  const exportToCSV = async () => {
    try {
      await simulateProgress();
      
      if (data.length === 0) {
        throw new Error('No data to export');
      }
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        exportOptions.includeHeaders ? headers.join(',') : '',
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].filter(Boolean).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', finalFileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      return { success: true, fileName: finalFileName };
    } catch (error) {
      throw new Error(`CSV export failed: ${error.message}`);
    }
  };

  // Main export handler
  const handleExport = async () => {
    if (data.length === 0) {
      onExportError?.('No data available for export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    onExportStart?.();

    try {
      let result;
      
      switch (exportOptions.format) {
        case 'excel':
          result = await exportToExcel();
          break;
        case 'pdf':
          result = await exportToPDF();
          break;
        case 'csv':
          result = await exportToCSV();
          break;
        default:
          throw new Error('Unsupported export format');
      }
      
      setLastExport({
        timestamp: new Date(),
        format: exportOptions.format,
        fileName: result.fileName,
        recordCount: data.length
      });
      
      onExportComplete?.(result);
    } catch (error) {
      console.error('Export error:', error);
      onExportError?.(error.message);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <PermissionGuard permissions={['export_reports']} fallback={<ExportAccessDenied />}>
      <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
                <p className="text-sm text-gray-600">
                  {data.length} records ready for export
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowAdvanced(!showAdvanced)}
              variant="ghost"
              size="sm"
            >
              <Settings className="h-4 w-4 mr-2" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {exportFormats.map((format) => {
                const Icon = format.icon;
                const isSelected = exportOptions.format === format.id;
                
                return (
                  <button
                    key={format.id}
                    onClick={() => setExportOptions(prev => ({ ...prev, format: format.id }))}
                    className={`p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-600' : format.color}`} />
                      <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {format.name}
                      </span>
                    </div>
                    <p className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {format.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Advanced Options</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeHeaders}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeHeaders: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Include column headers</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeTimestamp}
                      onChange={(e) => setExportOptions(prev => ({ 
                        ...prev, 
                        includeTimestamp: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Include export timestamp</span>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                  <select
                    value={exportOptions.dateFormat}
                    onChange={(e) => setExportOptions(prev => ({ 
                      ...prev, 
                      dateFormat: e.target.value 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Export Progress */}
          {isExporting && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="text-blue-800 font-medium">Exporting...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <p className="text-blue-700 text-sm mt-1">{Math.round(exportProgress)}% complete</p>
            </div>
          )}

          {/* Last Export Info */}
          {lastExport && !isExporting && (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 text-green-800 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Last Export Successful</span>
              </div>
              <p className="text-green-700 text-sm">
                {lastExport.recordCount} records exported as {lastExport.format.toUpperCase()} 
                on {lastExport.timestamp.toLocaleString()}
              </p>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleExport}
              disabled={isExporting || data.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export {exportFormats.find(f => f.id === exportOptions.format)?.name}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
};

// Access Denied Component
const ExportAccessDenied = () => (
  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
    <div className="text-amber-500 mb-4">
      <AlertCircle className="w-12 h-12 mx-auto" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Export Access Restricted</h3>
    <p className="text-gray-600">You need export permissions to download data.</p>
  </div>
);

export default EnhancedExportControls;
