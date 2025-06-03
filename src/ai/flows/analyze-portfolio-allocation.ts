
/**
 * @fileOverview Analyzes the portfolio allocation to determine the percentages of investments in large-cap, mid-cap, and small-cap stocks.
 *
 * - analyzePortfolioAllocation - A function that analyzes the portfolio allocation.
 */

import type { AnalyzePortfolioAllocationInput, AnalysisResult as AnalyzePortfolioAllocationOutput } from '@/types';

export async function analyzePortfolioAllocation(
  input: AnalyzePortfolioAllocationInput
): Promise<AnalyzePortfolioAllocationOutput> {
  const { portfolio } = input;

  // Calculate total investment amount
  const totalInvestment = portfolio.reduce((sum, fund) => sum + fund.weeklyInvestment, 0);

  if (totalInvestment === 0) {
    return {
      largeCapPercentage: 0,
      midCapPercentage: 0,
      smallCapPercentage: 0,
    };
  }

  // Calculate weighted average for each cap size
  let weightedLargeCap = 0;
  let weightedMidCap = 0;
  let weightedSmallCap = 0;

  for (const fund of portfolio) {
    const weight = fund.weeklyInvestment / totalInvestment;
    weightedLargeCap += (fund.largeCapHolding || 0) * weight;
    weightedMidCap += (fund.midCapHolding || 0) * weight;
    weightedSmallCap += (fund.smallCapHolding || 0) * weight;
  }

  const output: AnalyzePortfolioAllocationOutput = {
    largeCapPercentage: parseFloat(weightedLargeCap.toFixed(2)),
    midCapPercentage: parseFloat(weightedMidCap.toFixed(2)),
    smallCapPercentage: parseFloat(weightedSmallCap.toFixed(2)),
  };

  return output;
}
