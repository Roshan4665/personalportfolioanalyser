import type { MutualFund } from '@/types';

export const normalizeCsvKey = (header: string): string => {
  let key = header.trim();
  if (key.startsWith('%')) {
    key = 'percent' + key.substring(1);
  }
  return key
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special chars except space
    .replace(/\s+/g, ' ') // Normalize multiple spaces to one
    .split(' ')
    .map((word, index) =>
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
};

// A more robust CSV line parser that handles quoted fields
const parseCsvLine = (line: string): string[] => {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i+1] === '"') {
        // Escaped quote
        currentField += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(currentField.trim()); // Add the last field
  return result;
};


export const parseCsvData = (csvText: string): MutualFund[] => {
  const lines = csvText.trim().split(/\r?\n/); // Handles Windows and Unix line endings
  if (lines.length < 2) return [];

  const rawHeaders = parseCsvLine(lines[0]);
  const camelCaseHeaders = rawHeaders.map(normalizeCsvKey);

  return lines.slice(1).map((line, index) => {
    if (!line.trim()) return null; // Skip empty lines
    
    const values = parseCsvLine(line);
    const fund: any = { id: `fund-${Date.now()}-${index}` };

    camelCaseHeaders.forEach((header, i) => {
      if (values[i] === undefined) { // Handle rows with fewer columns than headers
        fund[header] = null;
        return;
      }
      const value = values[i];
      const numValue = parseFloat(value);
      if (value === "" || value === null || value === undefined) {
        fund[header] = null;
      } else if (!isNaN(numValue) && isFinite(numValue) && value.trim() === String(numValue)) {
        fund[header] = numValue;
      } else {
        fund[header] = value;
      }
    });
    return fund as MutualFund;
  }).filter(fund => fund !== null) as MutualFund[];
};
