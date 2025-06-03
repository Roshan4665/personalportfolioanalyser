
"use client";

import type { MutualFund } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle } from 'lucide-react';

interface FundCardProps {
  fund: MutualFund;
  onAddToPortfolio: (fund: MutualFund) => void;
}

export function FundCard({ fund, onAddToPortfolio }: FundCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="font-headline text-lg text-primary">{fund.name}</CardTitle>
        {fund.subCategory && <CardDescription>{fund.subCategory}</CardDescription>}
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        {fund.aum && <p>AUM: <span className="font-semibold">₹{fund.aum.toLocaleString()} Cr</span></p>}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {typeof fund.percentLargecapHolding === 'number' && <p>LC: {fund.percentLargecapHolding.toFixed(1)}%</p>}
            {typeof fund.percentMidcapHolding === 'number' && <p>MC: {fund.percentMidcapHolding.toFixed(1)}%</p>}
            {typeof fund.percentSmallcapHolding === 'number' && <p>SC: {fund.percentSmallcapHolding.toFixed(1)}%</p>}
            {typeof fund.sharpeRatio === 'number' && <p>Sharpe: {fund.sharpeRatio.toFixed(2)}</p>}
            {typeof fund.expenseRatio === 'number' && <p>Exp. Ratio: <span className="font-semibold">{fund.expenseRatio.toFixed(2)}%</span></p>}
            {typeof fund.cagr3y === 'number' && <p>CAGR 3Y: <span className="font-semibold">{fund.cagr3y.toFixed(2)}%</span></p>}
            {fund.fundManager && <p className="col-span-2">Manager: <span className="font-semibold truncate" title={fund.fundManager}>{fund.fundManager.substring(0,25)}{fund.fundManager.length > 25 ? "..." : ""}</span></p>}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onAddToPortfolio(fund)} variant="default" size="sm" className="w-full bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add to Portfolio
        </Button>
      </CardFooter>
    </Card>
  );
}
