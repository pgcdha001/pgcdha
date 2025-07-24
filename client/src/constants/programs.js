// Academic programs offered by the institution
export const PROGRAMS = [
  {
    value: 'ICS-PHY',
    label: 'ICS-PHY (Computer Science with Physics)',
    shortLabel: 'ICS-PHY'
  },
  {
    value: 'ICS-STAT',
    label: 'ICS-STAT (Computer Science with Statistics)',
    shortLabel: 'ICS-STAT'
  },
  {
    value: 'ICOM',
    label: 'ICOM (Commerce)',
    shortLabel: 'ICOM'
  },
  {
    value: 'Pre Engineering',
    label: 'Pre Engineering',
    shortLabel: 'Pre Engineering'
  },
  {
    value: 'Pre Medical',
    label: 'Pre Medical',
    shortLabel: 'Pre Medical'
  },
  {
    value: 'F.A',
    label: 'F.A (Faculty of Arts)',
    shortLabel: 'F.A'
  },
  {
    value: 'FA IT',
    label: 'FA IT (Faculty of Arts - Information Technology)',
    shortLabel: 'FA IT'
  },
  {
    value: 'General Science',
    label: 'General Science',
    shortLabel: 'General Science'
  }
];

// Helper function to get program options for dropdowns
export const getProgramOptions = (includeEmpty = true) => {
  const options = PROGRAMS.map(program => ({
    value: program.value,
    label: program.label
  }));

  if (includeEmpty) {
    return [{ value: '', label: 'Select Program' }, ...options];
  }

  return options;
};

// Helper function to get program display name
export const getProgramLabel = (programValue) => {
  const program = PROGRAMS.find(p => p.value === programValue);
  return program ? program.label : programValue;
};

// Helper function to validate program
export const isValidProgram = (programValue) => {
  return PROGRAMS.some(p => p.value === programValue);
};

// Export program values as array for validation
export const PROGRAM_VALUES = PROGRAMS.map(p => p.value);
