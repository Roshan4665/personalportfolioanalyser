
"use client";

import type { PortfolioAggregateStats } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Percent, Briefcase } from "lucide-react";

interface PortfolioSummaryStatsProps {
  stats: PortfolioAggregateStats | null;
}

export function PortfolioSummaryStats({ stats }: PortfolioSummaryStatsProps) {
  if (!stats) {
    return null; // Or a loading/empty state if preferred when portfolio is empty
  }

  return (
    <Card className="shadow-lg mb-8">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Portfolio Aggregate Stats</CardTitle>
        <CardDescription>Key weighted average metrics for your current portfolio.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatDisplay
            icon={<Percent className="h-8 w-8 text-accent" />}
            label="Weighted Avg. Expense Ratio"
            value={stats.weightedAverageExpenseRatio !== null ? `${stats.weightedAverageExpenseRatio.toFixed(2)}%` : "N/A"}
            tooltip="Average expense ratio across your portfolio, weighted by investment amount."
          />
          <StatDisplay
            icon={<TrendingUp className="h-8 w-8 text-green-500" />}
            label="Weighted Avg. CAGR (3Y)"
            value={stats.weightedAverageCagr3y !== null ? `${stats.weightedAverageCagr3y.toFixed(2)}%` : "N/A"}
            tooltip="Average 3-year Compound Annual Growth Rate, weighted by investment amount."
          />
          {/* Add more StatDisplay components here for other aggregate stats */}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tooltip?: string;
}

function StatDisplay({ icon, label, value, tooltip }: StatDisplayProps) {
  return (
    <div className="flex items-start space-x-4 p-4 bg-card rounded-lg border" title={tooltip}>
      <div className="flex-shrink-0">{icon}</div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}
