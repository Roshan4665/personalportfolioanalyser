
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
