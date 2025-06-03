
export interface MutualFund {
  id: string;
  name: string;
  subCategory?: string;
  plan?: string;
  aum?: number; 
  sortinoRatio?: number; 
  sharpeRatio?: number; 
  percentOtherHoldings?: number; 
  percentLargecapHolding?: number; 
  percentMidcapHolding?: number; 
  percentConcentrationTop10Holdings?: number; 
  percentEquityHolding?: number; 
  percentSmallcapHolding?: number; 
  percentConcentrationTop3Holdings?: number; 
  percentConcentrationTop5Holdings?: number; 
  percentCashHolding?: number; 

  cagr3y?: number;
  expenseRatio?: number;
  benchmark?: string;
  timeSinceInception?: string; 
  fundManager?: string;
  cagr10y?: number;
  alpha?: number; 
  absoluteReturns1y?: number; 
  cagr5y?: number;

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

  [key: string]: any; 
}

export interface PortfolioItem extends MutualFund {
  weeklyInvestment: number;
}

export interface AnalysisResult {
  largeCapPercentage: number;
  midCapPercentage: number;
  smallCapPercentage: number;
}

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
}
