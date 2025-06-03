
'use server';

import fs from 'fs';
import path from 'path';
import type { PortfolioItem } from '@/types';

/**
 * @fileOverview Server actions for the FundFolio Analyzer app.
 *
 * - getLocalCsvContent - Reads the content of a local CSV file.
 * - getDefaultPortfolio - Reads the content of data/my_funds.json.
 */

export async function getLocalCsvContent(): Promise<string | { error: string }> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'mutual_funds.csv');
    if (!fs.existsSync(filePath)) {
      return { error: 'CSV file not found at src/data/mutual_funds.csv. Please create the file and add your data.' };
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return fileContent;
  } catch (error) {
    console.error('Error reading local CSV file:', error);
    if (error instanceof Error) {
      return { error: `Failed to read local CSV file: ${error.message}` };
    }
    return { error: 'An unknown error occurred while reading the local CSV file.' };
  }
}

export async function getDefaultPortfolio(): Promise<PortfolioItem[] | { error: string }> {
  try {
    const filePath = path.join(process.cwd(), 'src', 'data', 'my_funds.json');
    if (!fs.existsSync(filePath)) {
      return { error: 'Default portfolio file (src/data/my_funds.json) not found.' };
    }
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const portfolioData: PortfolioItem[] = JSON.parse(fileContent);
    // Basic validation
    if (!Array.isArray(portfolioData) || !portfolioData.every(item => item.id && typeof item.weeklyInvestment === 'number' && item.name)) {
        return { error: 'Default portfolio file (src/data/my_funds.json) is not in the expected format.' };
    }
    return portfolioData;
  } catch (error) {
    console.error('Error reading or parsing default portfolio file:', error);
    if (error instanceof Error) {
      return { error: `Failed to load default portfolio: ${error.message}` };
    }
    return { error: 'An unknown error occurred while loading the default portfolio.' };
  }
}

