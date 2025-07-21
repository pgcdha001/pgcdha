export const ENQUIRY_LEVELS = [
  { 
    id: 1, 
    name: 'Not Purchased', 
    shortName: 'Not Purchased',
    color: 'blue', 
    bgColor: 'bg-blue-100', 
    textColor: 'text-blue-800',
    iconName: 'AlertCircle'
  },
  { 
    id: 2, 
    name: 'Purchased', 
    shortName: 'Purchased',
    color: 'yellow', 
    bgColor: 'bg-yellow-100', 
    textColor: 'text-yellow-800',
    iconName: 'Clock'
  },
  { 
    id: 3, 
    name: 'Returned', 
    shortName: 'Returned',
    color: 'purple', 
    bgColor: 'bg-purple-100', 
    textColor: 'text-purple-800',
    iconName: 'Clock'
  },
  { 
    id: 4, 
    name: 'Admission Fee Submitted', 
    shortName: 'Admission Fee Submitted',
    color: 'indigo', 
    bgColor: 'bg-indigo-100', 
    textColor: 'text-indigo-800',
    iconName: 'Clock'
  },
  { 
    id: 5, 
    name: '1st Installment Submitted', 
    shortName: 'Admitted Student',
    color: 'green', 
    bgColor: 'bg-green-100', 
    textColor: 'text-green-800',
    iconName: 'CheckCircle'
  },
  { 
    id: 6, 
    name: 'Rejected', 
    shortName: 'Rejected',
    color: 'red', 
    bgColor: 'bg-red-100', 
    textColor: 'text-red-800',
    iconName: 'XCircle'
  },
];

export const getLevelInfo = (levelId) => {
  return ENQUIRY_LEVELS.find(level => level.id === levelId) || ENQUIRY_LEVELS[0];
};

export const getStatusIcon = (levelId) => {
  switch (levelId) {
    case 5: return '✓'; // Admitted Student
    case 6: return '✗'; // Rejected
    case 4: return '💰'; // Admission Fee Submitted
    case 3: return '↩'; // Returned
    case 2: return '⚠'; // Purchased
    default: return '○'; // Not Purchased
  }
};
