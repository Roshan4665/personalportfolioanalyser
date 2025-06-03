
'use server';

import fs from 'fs';
import path from 'path';
import type { PortfolioItem } from '@/types';

/**
 * @fileOverview Server actions for the FundFolio Analyzer app.
 *
 * - getLocalCsvContent - Reads the content of a CSV file from a CDN.
 * - getDefaultPortfolio - Reads the content of data/my_funds.json from a CDN.
 */

const CDN_URL_CSV = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mutual_funds.csv';
const CDN_URL_DEFAULT_PORTFOLIO = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/my_funds.json';

export async function getLocalCsvContent(): Promise<string | { error: string }> {
  try {
    const response = await fetch(CDN_URL_CSV, { cache: 'no-store' });
    if (!response.ok) {
      return { error: `Failed to fetch CSV from CDN: ${response.status} ${response.statusText} at ${CDN_URL_CSV}` };
    }
    const fileContent = await response.text();
    if (!fileContent.trim()) {
        return { error: `CSV file from CDN is empty or invalid: ${CDN_URL_CSV}` };
    }
    return fileContent;
  } catch (error) {
    console.error('Error fetching CSV from CDN:', error);
    if (error instanceof Error) {
      return { error: `Failed to fetch CSV from CDN: ${error.message}` };
    }
    return { error: 'An unknown error occurred while fetching the CSV from CDN.' };
  }
}

export async function getDefaultPortfolio(): Promise<PortfolioItem[] | { error: string }> {
  try {
    const response = await fetch(CDN_URL_DEFAULT_PORTFOLIO, { cache: 'no-store' });
    if (!response.ok) {
      return { error: `Failed to fetch default portfolio from CDN: ${response.status} ${response.statusText} at ${CDN_URL_DEFAULT_PORTFOLIO}` };
    }
    const portfolioData: PortfolioItem[] = await response.json();
    
    // Basic validation
    if (!Array.isArray(portfolioData) || !portfolioData.every(item => item.id && typeof item.weeklyInvestment === 'number' && item.name)) {
        return { error: `Default portfolio from CDN (${CDN_URL_DEFAULT_PORTFOLIO}) is not in the expected format.` };
    }
    return portfolioData;
  } catch (error) {
    console.error('Error fetching or parsing default portfolio from CDN:', error);
    if (error instanceof Error) {
      return { error: `Failed to load default portfolio from CDN: ${error.message}` };
    }
    return { error: 'An unknown error occurred while loading the default portfolio from CDN.' };
  }
}
