import { useToast } from '../contexts/ToastContext';

// Hook for API operations with built-in toast notifications
export const useApiWithToast = () => {
  const { toast } = useToast();

  const handleApiResponse = async (apiCall, options = {}) => {
    const {
      successMessage,
      errorMessage,
      successToastType = 'success',
      showGenericError = true,
      onSuccess,
      onError
    } = options;

    try {
      const response = await apiCall();
      
      // Show success toast if message provided
      if (successMessage) {
        if (successToastType === 'success') {
          toast.success(successMessage);
        } else if (successToastType === 'info') {
          toast.info(successMessage);
        }
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response);
      }

      return response;
    } catch (error) {
      console.error('API Error:', error);
      
      // Show error toast
      const errorMsg = errorMessage || error.response?.data?.message || 'An error occurred';
      
      if (showGenericError) {
        toast.error(errorMsg);
      }

      // Call error callback if provided
      if (onError) {
        onError(error);
      }

      throw error; // Re-throw for caller to handle if needed
    }
  };

  // Specific toast methods for common operations
  const studentOperations = {
    add: (studentName) => toast.studentAdded(studentName),
    update: (studentName) => toast.studentUpdated(studentName),
    delete: (studentName) => toast.studentDeleted(studentName),
    stageChange: (studentName, stage) => toast.stageChanged(studentName, stage),
  };

  const staffOperations = {
    add: (staffName, role) => toast.staffAdded(staffName, role),
    update: (staffName) => toast.staffUpdated(staffName),
    delete: (staffName) => toast.staffDeleted(staffName),
  };

  const userOperations = {
    approve: (userName) => toast.userApproved(userName),
    deactivate: (userName) => toast.userDeactivated(userName),
  };

  const systemOperations = {
    dataImport: (count, type) => toast.dataImported(count, type),
    dataExport: (type) => toast.dataExported(type),
    reportGenerated: (type) => toast.reportGenerated(type),
  };

  return {
    handleApiResponse,
    toast,
    studentOperations,
    staffOperations,
    userOperations,
    systemOperations
  };
};

export default useApiWithToast;
