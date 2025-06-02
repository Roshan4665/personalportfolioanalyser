
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
  [key: string]: any; // To accommodate any other fields from CSV
}

export interface PortfolioItem extends MutualFund {
  weeklyInvestment: number; 
}

export interface AnalysisResult {
  largeCapPercentage: number;
  midCapPercentage: number;
  smallCapPercentage: number;
}

// Type for the structure of the GenAI flow input
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
