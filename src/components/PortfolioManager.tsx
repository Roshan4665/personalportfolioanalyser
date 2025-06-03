
"use client";

import * as React from 'react';
import type { PortfolioItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, ArrowUpDown, ArrowUp, ArrowDown, Edit3, Check, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

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
  onUpdateItemInvestment: (fundId: string, newAmount: number) => void;
}

export function PortfolioManager({ portfolioItems, onRemoveItem, onUpdateItemInvestment }: PortfolioManagerProps) {
  const [sortConfig, setSortConfig] = React.useState<{ key: SortKey | null; direction: 'ascending' | 'descending' }>({ key: 'weeklyInvestment', direction: 'descending' });
  const [editingFundId, setEditingFundId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const totalWeeklyInvestment = portfolioItems.reduce((sum, item) => sum + item.weeklyInvestment, 0);

  React.useEffect(() => {
    if (editingFundId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingFundId]);

  const handleEditClick = (item: PortfolioItem) => {
    setEditingFundId(item.id);
    setEditValue(String(item.weeklyInvestment));
  };

  const handleSaveEdit = () => {
    if (!editingFundId) return;
    const newAmount = parseFloat(editValue);
    if (isNaN(newAmount) || newAmount < 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid non-negative number for the investment.",
        variant: "destructive",
      });
      // Optionally, revert editValue to original or keep input open
      // For now, we just close editing mode without saving
      setEditingFundId(null);
      return;
    }
    const originalItem = portfolioItems.find(p => p.id === editingFundId);
    if (originalItem && newAmount !== originalItem.weeklyInvestment) {
        onUpdateItemInvestment(editingFundId, newAmount);
    }
    setEditingFundId(null);
  };

  const handleCancelEdit = () => {
    setEditingFundId(null);
    setEditValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

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
    { key: 'name', label: 'Fund Name', className: "sticky left-0 bg-card z-10 w-[250px] min-w-[250px]" },
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
          <div className="overflow-x-auto w-full rounded-md border">
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
                  <TableHead className="text-right sticky right-0 bg-card z-10 min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map(item => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium sticky left-0 bg-card z-10 w-[250px] min-w-[250px]">{item.name}</TableCell>
                    <TableCell className="text-right" onClick={() => { if(editingFundId !== item.id) handleEditClick(item)}}>
                      {editingFundId === item.id ? (
                        <div className="flex items-center justify-end gap-1">
                           <Input
                            ref={inputRef}
                            type="number"
                            value={editValue}
                            onChange={handleInputChange}
                            onKeyDown={handleInputKeyDown}
                            onBlur={handleSaveEdit} // Save on blur
                            className="h-8 w-24 text-right"
                          />
                          {/* Save and Cancel buttons could be added here for more explicit control if desired */}
                        </div>
                      ) : (
                        <>
                          {item.weeklyInvestment.toLocaleString()}
                          <Button variant="ghost" size="icon" className="ml-1 h-6 w-6 text-primary/70 hover:text-primary" onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{item.overallContributionPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.contributionToOverallLargeCapPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.contributionToOverallMidCapPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">{item.contributionToOverallSmallCapPercent.toFixed(2)}%</TableCell>
                    <TableCell className="text-right sticky right-0 bg-card z-10 min-w-[100px]">
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
