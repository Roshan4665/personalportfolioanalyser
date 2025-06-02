"use client"

import * as React from "react"
import { PieChart as PieChartIcon } from "lucide-react"
import { Label, Pie, PieChart, Cell } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { AnalysisResult } from "@/types";

interface AllocationPieChartProps {
  analysisResult: AnalysisResult | null;
  isLoading: boolean;
}

const chartConfig = {
  largeCap: { label: "Large Cap", color: "hsl(var(--chart-1))" },
  midCap: { label: "Mid Cap", color: "hsl(var(--chart-2))" },
  smallCap: { label: "Small Cap", color: "hsl(var(--chart-3))" },
} satisfies Record<string, { label: string; color: string }>;


export function AllocationPieChart({ analysisResult, isLoading }: AllocationPieChartProps) {
  const chartData = React.useMemo(() => {
    if (!analysisResult) return [];
    return [
      { category: "largeCap", value: analysisResult.largeCapPercentage, fill: chartConfig.largeCap.color },
      { category: "midCap", value: analysisResult.midCapPercentage, fill: chartConfig.midCap.color },
      { category: "smallCap", value: analysisResult.smallCapPercentage, fill: chartConfig.smallCap.color },
    ].filter(item => item.value > 0); // Only include categories with value > 0 for cleaner chart
  }, [analysisResult]);

  const totalPercentage = React.useMemo(() => {
    if (!analysisResult) return 0;
    return (
      analysisResult.largeCapPercentage +
      analysisResult.midCapPercentage +
      analysisResult.smallCapPercentage
    );
  }, [analysisResult]);

  if (isLoading) {
    return (
      <Card className="flex flex-col h-[400px] justify-center items-center shadow-lg">
        <CardHeader className="items-center pb-0">
          <CardTitle className="font-headline text-primary">Portfolio Allocation</CardTitle>
          <CardDescription>Analyzing your portfolio...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0 flex items-center justify-center">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisResult || chartData.length === 0) {
     return (
      <Card className="flex flex-col h-[400px] justify-center items-center shadow-lg">
        <CardHeader className="items-center text-center pb-0">
          <CardTitle className="font-headline text-primary">Portfolio Allocation</CardTitle>
          <CardDescription>No data to display. Add funds to your portfolio.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <PieChartIcon className="h-24 w-24 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[400px] shadow-lg">
      <CardHeader className="items-center pb-0">
        <CardTitle className="font-headline text-primary">Portfolio Allocation</CardTitle>
        <CardDescription>Distribution of your investments by market cap.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel nameKey="category" formatter={(value, name) => `${chartConfig[name as keyof typeof chartConfig]?.label}: ${value.toFixed(2)}%`} />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              innerRadius={60}
              strokeWidth={2}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold font-headline"
                        >
                          {totalPercentage.toFixed(0)}%
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-sm"
                        >
                          Total Equity
                        </tspan>
                      </text>
                    )
                  }
                  return null;
                }}
              />
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.category}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
