
import type { MutualFund } from '@/types';

export const normalizeCsvKey = (header: string): string => {
  let key = header.trim();
  // Handle cases like "3Y Avg Annual Rolling Return " -> "3yAvgAnnualRollingReturn"
  // or "CAGR 3Y" -> "cagr3y"
  key = key.replace(/\b(\d+Y)\b/g, (match) => match.toLowerCase()); // 3Y -> 3y

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


export const parseCsvData = (csvText: string): Omit<MutualFund, 'id'>[] => {
  const lines = csvText.trim().split(/\r?\n/); // Handles Windows and Unix line endings
  if (lines.length < 2) return [];

  const rawHeaders = parseCsvLine(lines[0]);
  const camelCaseHeaders = rawHeaders.map(normalizeCsvKey);

  return lines.slice(1).map((line) => {
    if (!line.trim()) return null; // Skip empty lines
    
    const values = parseCsvLine(line);
    const fund: any = {}; // ID will be assigned after merging

    camelCaseHeaders.forEach((header, i) => {
      if (values[i] === undefined) { // Handle rows with fewer columns than headers
        fund[header] = null;
        return;
      }
      let value = values[i];

      // Attempt to strip percentage signs and convert to number
      if (typeof value === 'string' && value.endsWith('%')) {
        const numPart = value.substring(0, value.length - 1);
        const possibleNum = parseFloat(numPart);
        if (!isNaN(possibleNum) && isFinite(possibleNum)) {
          value = String(possibleNum); // Keep as string for generic parsing, will be parsed to float next
        }
      }
      
      const numValue = parseFloat(value);

      if (value === "" || value === null || value === undefined || value.toLowerCase() === 'n.a.' || value.toLowerCase() === 'na') {
        fund[header] = null;
      } else if (!isNaN(numValue) && isFinite(numValue) && String(value).trim() === String(numValue)) {
         // Check if the original string value (after potential % stripping) is purely numeric
        fund[header] = numValue;
      }
       else {
        fund[header] = value;
      }
    });
    return fund as Omit<MutualFund, 'id'>;
  }).filter(fund => fund !== null && fund.name) as Omit<MutualFund, 'id'>[]; // Ensure fund is not null and has a name
};
