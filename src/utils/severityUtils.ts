/**
 * Mapping severity levels to color codes for UI display
 */
export const severityColorMap: Record<string, string> = {
  'critical': '#d32f2f',  // Dark red
  'high': '#f44336',      // Red
  'medium': '#ff9800',    // Orange
  'low': '#ffeb3b',       // Yellow
  'info': '#2196f3',      // Blue
  'informational': '#2196f3',
  'unknown': '#9e9e9e'    // Grey
};

/**
 * Get severity level from CVSS score
 */
export const getSeverityFromCvss = (cvss: number): string => {
  if (cvss >= 9.0) {
    return 'critical';
  } else if (cvss >= 7.0) {
    return 'high';
  } else if (cvss >= 4.0) {
    return 'medium';
  } else if (cvss >= 0.1) {
    return 'low';
  } else {
    return 'info';
  }
};

/**
 * Sort severity levels from highest to lowest
 */
export const sortSeverities = (severities: string[]): string[] => {
  const severityOrder: Record<string, number> = {
    'critical': 5,
    'high': 4,
    'medium': 3,
    'low': 2,
    'info': 1,
    'informational': 1,
    'unknown': 0
  };

  return [...severities].sort((a, b) => 
    (severityOrder[b.toLowerCase()] || 0) - (severityOrder[a.toLowerCase()] || 0)
  );
};

/**
 * Get contrast text color for background color
 * Returns white or black depending on background color brightness
 */
export const getContrastTextColor = (backgroundColor: string): 'white' | 'black' => {
  // Convert hex to RGB
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate brightness
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  // Return white for dark backgrounds, black for light backgrounds
  return brightness > 125 ? 'black' : 'white';
}; 