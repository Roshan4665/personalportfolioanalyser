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
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-lg text-primary">{fund.name}</CardTitle>
        {fund.subCategory && <CardDescription>{fund.subCategory}</CardDescription>}
      </CardHeader>
      <CardContent className="text-sm space-y-1">
        {fund.aum && <p>AUM: <span className="font-semibold">₹{fund.aum.toLocaleString()} Cr</span></p>}
        <div className="grid grid-cols-2 gap-x-4">
            {typeof fund.percentLargecapHolding === 'number' && <p>Large Cap: {fund.percentLargecapHolding.toFixed(2)}%</p>}
            {typeof fund.percentMidcapHolding === 'number' && <p>Mid Cap: {fund.percentMidcapHolding.toFixed(2)}%</p>}
            {typeof fund.percentSmallcapHolding === 'number' && <p>Small Cap: {fund.percentSmallcapHolding.toFixed(2)}%</p>}
            {typeof fund.sharpeRatio === 'number' && <p>Sharpe: {fund.sharpeRatio.toFixed(2)}</p>}
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
