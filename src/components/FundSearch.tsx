
"use client";

import * as React from 'react';
import type { MutualFund } from '@/types';
import { Input } from '@/components/ui/input';
import { FundCard } from './FundCard';
import { Search } from 'lucide-react';

interface FundSearchProps {
  allFunds: MutualFund[];
  onAddToPortfolio: (fund: MutualFund) => void;
}

export function FundSearch({ allFunds, onAddToPortfolio }: FundSearchProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredFunds = React.useMemo(() => {
    if (!searchTerm) {
      return allFunds.slice(0, 3); // Show top 3 by default or if search is empty
    }
    return allFunds.filter(fund =>
      fund.name.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0,50); // Limit results to 50 for performance
  }, [allFunds, searchTerm]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-headline text-2xl mb-3 text-primary">Search Mutual Funds</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by fund name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-base"
          />
        </div>
      </div>
      {filteredFunds.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFunds.map(fund => (
            <FundCard key={fund.id} fund={fund} onAddToPortfolio={onAddToPortfolio} />
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center py-8">
          {searchTerm ? "No funds match your search." : "No funds available to search. Check data/mutual_funds.csv."}
        </p>
      )}
    </div>
  );
}

