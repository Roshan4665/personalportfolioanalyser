
"use client";

import * as React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, AlertCircle } from "lucide-react";

interface PortfolioForecastChartProps {
  totalWeeklyInvestment: number;
  annualCagr: number | null; // Percentage, e.g., 10 for 10%
}

const calculateFutureValueAnnuity = (annualInvestment: number, rate: number, years: number): number => {
  if (rate === 0) {
    return annualInvestment * years;
  }
  // FV = P * [((1 + r)^n - 1) / r]
  // Ensure no division by zero if rate somehow becomes extremely small but not exactly 0 after calculations
  if (rate === 0) return annualInvestment * years;
  return annualInvestment * (Math.pow(1 + rate, years) - 1) / rate;
};

export function PortfolioForecastChart({ totalWeeklyInvestment, annualCagr }: PortfolioForecastChartProps) {
  const chartData = React.useMemo(() => {
    if (annualCagr === null || annualCagr <= 0 || totalWeeklyInvestment <= 0) {
      return [];
    }

    const rate = annualCagr / 100;
    const annualInvestment = totalWeeklyInvestment * 52;
    // Generate data for years 0 through 20
    const yearsArray = Array.from({ length: 21 }, (_, i) => i); // 0, 1, 2, ..., 20


    return yearsArray.map(years => {
      if (years === 0) {
        return {
          year: years,
          projectedValue: 0, 
          totalInvested: 0,
        };
      }
      
      const fv = calculateFutureValueAnnuity(annualInvestment, rate, years);
      const cumulativeInvestment = annualInvestment * years;

      return {
        year: years,
        projectedValue: parseFloat(fv.toFixed(0)),
        totalInvested: parseFloat(cumulativeInvestment.toFixed(0))
      };
    });
  }, [totalWeeklyInvestment, annualCagr]);

  if (annualCagr === null || annualCagr <= 0 || totalWeeklyInvestment <= 0) {
    return (
      <Card className="shadow-lg h-[400px]">
        <CardHeader>
          <CardTitle className="font-headline text-primary flex items-center">
            <TrendingUp className="mr-2 h-6 w-6" />
            Portfolio Growth Forecast
          </CardTitle>
          <CardDescription>
            Projected portfolio value over time based on current investments and growth rate.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {totalWeeklyInvestment <= 0 ? "Add weekly investments to your portfolio to see a forecast." : "Portfolio forecast requires a positive Weighted Average CAGR (3Y)."}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {annualCagr !== null && annualCagr <=0 && totalWeeklyInvestment > 0 && "The current weighted average 3Y CAGR is not positive."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline text-primary flex items-center">
          <TrendingUp className="mr-2 h-6 w-6" />
          Portfolio Growth Forecast
        </CardTitle>
        <CardDescription>
          Projected value assuming weekly investment of ₹{totalWeeklyInvestment.toLocaleString()} continues at a {annualCagr.toFixed(2)}% annual growth rate.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-6 pb-2"> {/* Added flex-1 to allow content to grow */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="year" 
              label={{ value: 'Years', position: 'insideBottomRight', dy:10, fill: 'hsl(var(--muted-foreground))' }}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              interval="preserveStartEnd" // Better tick management for more data points
            />
            <YAxis 
              tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              label={{ value: 'Value (₹)', angle: -90, position: 'insideLeft', offset: -20, fill: 'hsl(var(--muted-foreground))' }}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const displayValue = `₹${value.toLocaleString()}`;
                if (name === "projectedValue") return [displayValue, "Projected Value"];
                if (name === "totalInvested") return [displayValue, "Total Invested"];
                return [displayValue, name];
              }}
              labelFormatter={(label) => `Year ${label}`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)' 
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
              cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: "3 3" }}
            />
            <Legend verticalAlign="top" wrapperStyle={{ color: 'hsl(var(--muted-foreground))', paddingBottom: '10px' }} />
            <Line 
              type="monotone" 
              dataKey="projectedValue" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              activeDot={{ r: 6, fill: 'hsl(var(--primary))' }} 
              name="Projected Value" 
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
            />
            <Line 
              type="monotone" 
              dataKey="totalInvested" 
              stroke="hsl(var(--accent))" 
              strokeWidth={2} 
              activeDot={{ r: 6, fill: 'hsl(var(--accent))' }} 
              name="Total Invested"
              dot={{ fill: 'hsl(var(--accent))', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
