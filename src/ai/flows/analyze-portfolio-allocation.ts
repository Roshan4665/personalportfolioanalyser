
'use server';

/**
 * @fileOverview Analyzes the portfolio allocation to determine the percentages of investments in large-cap, mid-cap, and small-cap stocks.
 *
 * - analyzePortfolioAllocation - A function that analyzes the portfolio allocation.
 * - AnalyzePortfolioAllocationInput - The input type for the analyzePortfolioAllocation function.
 * - AnalyzePortfolioAllocationOutput - The return type for the analyzePortfolioAllocation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePortfolioAllocationInputSchema = z.object({
  portfolio: z
    .array(
      z.object({
        name: z.string().describe('Name of the mutual fund.'),
        largeCapHolding: z
          .number()
          .describe('Percentage of large-cap holdings in the mutual fund.'),
        midCapHolding: z
          .number()
          .describe('Percentage of mid-cap holdings in the mutual fund.'),
        smallCapHolding: z
          .number()
          .describe('Percentage of small-cap holdings in the mutual fund.'),
        weeklyInvestment: z // Changed from monthlyInvestment
          .number()
          .describe('Weekly investment amount in the mutual fund.'),
      })
    )
    .describe('Array of mutual funds in the portfolio.'),
});
export type AnalyzePortfolioAllocationInput = z.infer<
  typeof AnalyzePortfolioAllocationInputSchema
>;

const AnalyzePortfolioAllocationOutputSchema = z.object({
  largeCapPercentage: z
    .number()
    .describe('Percentage of portfolio allocated to large-cap stocks.'),
  midCapPercentage: z
    .number()
    .describe('Percentage of portfolio allocated to mid-cap stocks.'),
  smallCapPercentage: z
    .number()
    .describe('Percentage of portfolio allocated to small-cap stocks.'),
});
export type AnalyzePortfolioAllocationOutput = z.infer<
  typeof AnalyzePortfolioAllocationOutputSchema
>;

export async function analyzePortfolioAllocation(
  input: AnalyzePortfolioAllocationInput
): Promise<AnalyzePortfolioAllocationOutput> {
  return analyzePortfolioAllocationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePortfolioAllocationPrompt',
  input: {schema: AnalyzePortfolioAllocationInputSchema},
  output: {schema: AnalyzePortfolioAllocationOutputSchema},
  prompt: `You are a portfolio analysis expert. Analyze the given portfolio and determine the overall allocation percentages for large-cap, mid-cap, and small-cap stocks. Take into account the weekly investment amount for each fund when calculating the overall percentages.

Portfolio:
{{#each portfolio}}
  - Name: {{name}}, Large-Cap: {{largeCapHolding}}%, Mid-Cap: {{midCapHolding}}%, Small-Cap: {{smallCapHolding}}%, Investment: {{weeklyInvestment}}
{{/each}}

Calculate the weighted average for each category based on the weekly investment in each fund.

Output the percentages in the following JSON format:
${JSON.stringify(AnalyzePortfolioAllocationOutputSchema.shape, null, 2)}`,
});

const analyzePortfolioAllocationFlow = ai.defineFlow(
  {
    name: 'analyzePortfolioAllocationFlow',
    inputSchema: AnalyzePortfolioAllocationInputSchema,
    outputSchema: AnalyzePortfolioAllocationOutputSchema,
  },
  async input => {
    const {
      portfolio,
    } = input;

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
);
