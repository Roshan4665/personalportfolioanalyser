
'use server';

import type { PortfolioItem, MutualFund } from '@/types';
import { parseCsvData } from '@/lib/csvParser';

const CDN_URL_DEFAULT_PORTFOLIO = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/my_funds.json';
const CDN_URL_BASE_FUNDS_CSV = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mutual_funds.csv';
const CDN_URL_MF1_CSV = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mf1.csv';
const CDN_URL_MF2_CSV = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mf2.csv';


async function fetchAndParseCsv(url: string): Promise<Partial<MutualFund>[] | { error: string }> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return { error: `Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}` };
    }
    const fileContent = await response.text();
    if (!fileContent.trim()) {
      // It's okay for a supplemental CSV to be empty, just return empty array.
      // For base CSV, an error might be more appropriate if it's critical.
      return []; 
    }
    return parseCsvData(fileContent);
  } catch (error) {
    console.error(`Error fetching or parsing CSV from ${url}:`, error);
    if (error instanceof Error) {
      return { error: `Failed to process CSV from ${url}: ${error.message}` };
    }
    return { error: `An unknown error occurred while processing CSV from ${url}.` };
  }
}

export async function fetchAndProcessFundData(): Promise<MutualFund[] | { error: string }> {
  const results = await Promise.all([
    fetchAndParseCsv(CDN_URL_BASE_FUNDS_CSV),
    fetchAndParseCsv(CDN_URL_MF1_CSV),
    fetchAndParseCsv(CDN_URL_MF2_CSV),
  ]);

  const baseFundsResult = results[0];
  const mf1DataResult = results[1];
  const mf2DataResult = results[2];

  if ('error' in baseFundsResult && Array.isArray(baseFundsResult) && baseFundsResult.length === 0) { // if base CSV fails and is primary
     console.warn("Base funds CSV could not be loaded or is empty. Proceeding with other CSVs if available, but data might be incomplete.");
  }


  const fundMap = new Map<string, Partial<MutualFund>>();

  const processFundList = (list: Partial<MutualFund>[] | {error: string}) => {
    if ('error' in list) {
        console.warn(`Skipping a fund list due to error: ${list.error}`);
        return;
    }
    if (!Array.isArray(list)) return;

    list.forEach(fund => {
      if (fund.name) {
        const existingFund = fundMap.get(fund.name) || {};
        // Simple merge: last one wins for conflicting properties.
        // More sophisticated merging might be needed if properties have different priorities.
        fundMap.set(fund.name, { ...existingFund, ...fund });
      }
    });
  };

  processFundList(baseFundsResult);
  processFundList(mf1DataResult);
  processFundList(mf2DataResult);
  
  let finalFundList: MutualFund[] = Array.from(fundMap.values()).map((fund, index) => {
    // Ensure all essential fields are present or defaulted, and assign a stable ID
    const nameIdentifier = fund.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || `unknown-${index}`;
    return {
      id: `fund-${nameIdentifier}-${index}`, // Generate a more stable ID
      name: fund.name || 'Unknown Fund',
      subCategory: fund.subCategory,
      plan: fund.plan,
      aum: typeof fund.aum === 'number' ? fund.aum : undefined,
      sortinoRatio: typeof fund.sortinoRatio === 'number' ? fund.sortinoRatio : undefined,
      sharpeRatio: typeof fund.sharpeRatio === 'number' ? fund.sharpeRatio : undefined,
      percentLargecapHolding: typeof fund.percentLargecapHolding === 'number' ? fund.percentLargecapHolding : undefined,
      percentMidcapHolding: typeof fund.percentMidcapHolding === 'number' ? fund.percentMidcapHolding : undefined,
      percentSmallcapHolding: typeof fund.percentSmallcapHolding === 'number' ? fund.percentSmallcapHolding : undefined,
      percentEquityHolding: typeof fund.percentEquityHolding === 'number' ? fund.percentEquityHolding : undefined,
      percentCashHolding: typeof fund.percentCashHolding === 'number' ? fund.percentCashHolding : undefined,
      cagr3y: typeof fund.cagr3y === 'number' ? fund.cagr3y : undefined,
      expenseRatio: typeof fund.expenseRatio === 'number' ? fund.expenseRatio : undefined,
      benchmark: fund.benchmark,
      timeSinceInception: fund.timeSinceInception,
      fundManager: fund.fundManager,
      cagr10y: typeof fund.cagr10y === 'number' ? fund.cagr10y : undefined,
      alpha: typeof fund.alpha === 'number' ? fund.alpha : undefined,
      absoluteReturns1y: typeof fund.absoluteReturns1y === 'number' ? fund.absoluteReturns1y : undefined,
      cagr5y: typeof fund.cagr5y === 'number' ? fund.cagr5y : undefined,
      absoluteReturns3m: typeof fund.absoluteReturns3m === 'number' ? fund.absoluteReturns3m : undefined,
      absoluteReturns6m: typeof fund.absoluteReturns6m === 'number' ? fund.absoluteReturns6m : undefined,
      returnsVsSubCategory5y: typeof fund.returnsVsSubCategory5y === 'number' ? fund.returnsVsSubCategory5y : undefined,
      returnsVsSubCategory10y: typeof fund.returnsVsSubCategory10y === 'number' ? fund.returnsVsSubCategory10y : undefined,
      peRatio: typeof fund.peRatio === 'number' ? fund.peRatio : undefined,
      categoryPeRatio: typeof fund.categoryPeRatio === 'number' ? fund.categoryPeRatio : undefined,
      returnsVsSubCategory1y: typeof fund.returnsVsSubCategory1y === 'number' ? fund.returnsVsSubCategory1y : undefined,
      returnsVsSubCategory3y: typeof fund.returnsVsSubCategory3y === 'number' ? fund.returnsVsSubCategory3y : undefined,
      percentAwayFromAth: typeof fund.percentAwayFromAth === 'number' ? fund.percentAwayFromAth : undefined,
      trackingError: typeof fund.trackingError === 'number' ? fund.trackingError : undefined,
      ...fund // Spread any other properties not explicitly listed
    } as MutualFund;
  });
  
  if (finalFundList.length === 0 && ('error' in baseFundsResult || 'error' in mf1DataResult || 'error' in mf2DataResult )) {
    // If all sources failed or yielded no data, and there was an error, return that error.
    // Pick the first error encountered.
    const firstError = [baseFundsResult, mf1DataResult, mf2DataResult].find(r => 'error' in r);
    if (firstError && 'error' in firstError) return { error: `Failed to load any fund data. First error: ${firstError.error}` };
    return { error: "No fund data could be loaded from any CDN source." };
  }


  return finalFundList;
}


export async function getDefaultPortfolio(): Promise<PortfolioItem[] | { error: string }> {
  try {
    const response = await fetch(CDN_URL_DEFAULT_PORTFOLIO, { cache: 'no-store' });
    if (!response.ok) {
      return { error: `Failed to fetch default portfolio from CDN: ${response.status} ${response.statusText} at ${CDN_URL_DEFAULT_PORTFOLIO}` };
    }
    const portfolioData: PortfolioItem[] = await response.json();
    
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
