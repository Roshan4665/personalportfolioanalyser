
export interface MutualFund {
  id: string;
  name: string;
  subCategory?: string;
  plan?: string;
  aum?: number; // From base and mf1
  sortinoRatio?: number; // From base
  sharpeRatio?: number; // From base
  percentOtherHoldings?: number; // From base
  percentLargecapHolding?: number; // From base
  percentMidcapHolding?: number; // From base
  percentConcentrationTop10Holdings?: number; // From base
  percentEquityHolding?: number; // From base
  percentSmallcapHolding?: number; // From base
  percentConcentrationTop3Holdings?: number; // From base
  percentConcentrationTop5Holdings?: number; // From base
  percentCashHolding?: number; // From base

  // Fields from mf1.csv
  cagr3y?: number;
  expenseRatio?: number;
  benchmark?: string;
  timeSinceInception?: string; // Assuming string, might need parsing if used as Date
  fundManager?: string;
  cagr10y?: number;
  alpha?: number; // Which alpha? (3Y, 5Y - mf1 has one "Alpha") - assuming general alpha
  absoluteReturns1y?: number; // Also in mf2, need to decide on merge
  cagr5y?: number;

  // Fields from mf2.csv
  absoluteReturns3m?: number;
  absoluteReturns6m?: number;
  returnsVsSubCategory5y?: number;
  returnsVsSubCategory10y?: number;
  peRatio?: number;
  categoryPeRatio?: number;
  returnsVsSubCategory1y?: number;
  returnsVsSubCategory3y?: number;
  percentAwayFromAth?: number;
  trackingError?: number;

  [key: string]: any; // To accommodate any other fields from CSV
}

export interface PortfolioItem extends MutualFund {
  weeklyInvestment: number;
}

// This type is used for the result of the portfolio analysis
export interface AnalysisResult {
  largeCapPercentage: number;
  midCapPercentage: number;
  smallCapPercentage: number;
}

// Type for the input of the portfolio analysis function
export type AnalyzePortfolioAllocationInputItem = {
  name: string;
  largeCapHolding: number;
  midCapHolding: number;
  smallCapHolding: number;
  weeklyInvestment: number;
};

export type AnalyzePortfolioAllocationInput = {
  portfolio: AnalyzePortfolioAllocationInputItem[];
};

export interface PortfolioAggregateStats {
  weightedAverageExpenseRatio: number | null;
  weightedAverageCagr3y: number | null;
  // Add more aggregate stats here as needed
}
