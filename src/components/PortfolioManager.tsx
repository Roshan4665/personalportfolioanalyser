
"use client";

import * as React from 'react';
import type { PortfolioItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
// import { ScrollArea } from '@/components/ui/scroll-area'; // Removed ScrollArea
import { Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface AugmentedPortfolioItem extends PortfolioItem {
  overallContributionPercent: number;
  contributionToOverallLargeCapPercent: number;
  contributionToOverallMidCapPercent: number;
  contributionToOverallSmallCapPercent: number;
  absoluteLargeCap: number;
  absoluteMidCap: number;
  absoluteSmallCap: number;
}

type SortKey = keyof AugmentedPortfolioItem | 'name' | 'weeklyInvestment' | 'overallContributionPercent' | 'contributionToOverallLargeCapPercent' | 'contributionToOverallMidCapPercent' | 'contributionToOverallSmallCapPercent';

interface PortfolioManagerProps {
  portfolioItems: PortfolioItem[];
  onRemoveItem: (fundId: string) => void;
}

export function PortfolioManager({ portfolioItems, onRemoveItem }: PortfolioManagerProps) {
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey | null; direction: 'ascending' | 'descending' }>({ key: 'weeklyInvestment', direction: 'descending' });

  const totalWeeklyInvestment = portfolioItems.reduce((sum, item) => sum + item.weeklyInvestment, 0);

  const augmentedPortfolioItems: AugmentedPortfolioItem[] = React.useMemo(() => {
    if (portfolioItems.length === 0) return [];

    const itemsWithAbsoluteCaps = portfolioItems.map(item => ({
      ...item,
      absoluteLargeCap: item.weeklyInvestment * ((item.percentLargecapHolding || 0) / 100),
      absoluteMidCap: item.weeklyInvestment * ((item.percentMidcapHolding || 0) / 100),
      absoluteSmallCap: item.weeklyInvestment * ((item.percentSmallcapHolding || 0) / 100),
    }));

    const portfolioTotalAbsoluteLargeCap = itemsWithAbsoluteCaps.reduce((sum, item) => sum + item.absoluteLargeCap, 0);
    const portfolioTotalAbsoluteMidCap = itemsWithAbsoluteCaps.reduce((sum, item) => sum + item.absoluteMidCap, 0);
    const portfolioTotalAbsoluteSmallCap = itemsWithAbsoluteCaps.reduce((sum, item) => sum + item.absoluteSmallCap, 0);

    return itemsWithAbsoluteCaps.map(item => ({
      ...item,
      overallContributionPercent: totalWeeklyInvestment > 0 ? (item.weeklyInvestment / totalWeeklyInvestment) * 100 : 0,
      contributionToOverallLargeCapPercent: portfolioTotalAbsoluteLargeCap > 0 ? (item.absoluteLargeCap / portfolioTotalAbsoluteLargeCap) * 100 : 0,
      contributionToOverallMidCapPercent: portfolioTotalAbsoluteMidCap > 0 ? (item.absoluteMidCap / portfolioTotalAbsoluteMidCap) * 100 : 0,
      contributionToOverallSmallCapPercent: portfolioTotalAbsoluteSmallCap > 0 ? (item.absoluteSmallCap / portfolioTotalAbsoluteSmallCap) * 100 : 0,
    }));
  }, [portfolioItems, totalWeeklyInvestment]);

  const sortedItems = React.useMemo(() => {
    let sortableItems = [...augmentedPortfolioItems];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key as keyof AugmentedPortfolioItem];
        const valB = b[sortConfig.key as keyof AugmentedPortfolioItem];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        return 0;
      });
    }
    return sortableItems;
  }, [augmentedPortfolioItems, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="ml-2 h-3 w-3" /> : <ArrowDown className="ml-2 h-3 w-3" />;
  };

  const columns: { key: SortKey; label: string; className?: string, isNumeric?: boolean }[] = [
    { key: 'name', label: 'Fund Name', className: "sticky left-0 bg-card z-10 w-[250px] min-w-[250px]" }, // Added min-w
    { key: 'weeklyInvestment', label: 'Weekly Inv. (₹)', className: "text-right", isNumeric: true },
    { key: 'overallContributionPercent', label: 'Portfolio %', className: "text-right", isNumeric: true },
    { key: 'contributionToOverallLargeCapPercent', label: 'LC Contrib. %', className: "text-right", isNumeric: true },
    { key: 'contributionToOverallMidCapPercent', label: 'MC Contrib. %', className: "text-right", isNumeric: true },
    { key: 'contributionToOverallSmallCapPercent', label: 'SC Contrib. %', className: "text-right", isNumeric: true },
  ];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-primary">Your Portfolio</CardTitle>
        {portfolioItems.length > 0 && (
            <CardDescription>
            Total Weekly Investment: <span className="font-bold text-foreground">₹{totalWeeklyInvestment.toLocaleString()}</span>
            </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {portfolioItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Your portfolio is empty. Add funds to see them here.</p>
        ) : (
          <div className="overflow-x-auto w-full rounded-md border"> {/* Replaced ScrollArea with this div */}
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead 
                      key={col.key} 
                      className={`cursor-pointer hover:bg-muted/50 ${col.className || ''}`}
                      onClick={() => requestSort(col.key)}
                    >
                      <div className={`flex items-center ${col.isNumeric ? 'justify-end' : 'justify-start'}`}>
                        {col.label}
                        {getSortIcon(col.key)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-right sticky right-0 bg-card z-10 min-w-[100px]">Actions</TableHead> {/* Added min-w */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 w-[250px] min-w-[250px]">{item.name}</TableCell> {/* Added min-w */}
                    <TableCell className="text-right">{item.weeklyInvestment.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{item.overallContributionPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.contributionToOverallLargeCapPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.contributionToOverallMidCapPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.contributionToOverallSmallCapPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right sticky right-0 bg-card z-10 min-w-[100px]"> {/* Added min-w */}
                      <Button variant="ghost" size="icon" onClick={() => onRemoveItem(item.id)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove {item.name}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

