
"use client";

import * as React from 'react';
import type { MutualFund } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

interface AddFundDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fund: MutualFund | null;
  onAddFund: (fund: MutualFund, weeklyInvestment: number) => void; // Changed from monthlyInvestment
}

export function AddFundDialog({ isOpen, onOpenChange, fund, onAddFund }: AddFundDialogProps) {
  const [amount, setAmount] = React.useState('');
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setAmount(''); // Reset amount when dialog opens
    }
  }, [isOpen]);

  const handleSubmit = () => {
    const investmentAmount = parseFloat(amount);
    if (!fund) return;
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive weekly investment amount.", // Changed from monthly
        variant: "destructive",
      });
      return;
    }
    onAddFund(fund, investmentAmount);
    onOpenChange(false);
  };

  if (!fund) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-primary">Add to Portfolio</DialogTitle>
          <DialogDescription>
            Enter the weekly amount you want to invest in <span className="font-semibold">{fund.name}</span>. {/* Changed from monthly */}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="weekly-investment" className="text-right col-span-1">
              Amount (₹)
            </Label>
            <Input
              id="weekly-investment" // Changed from monthly-investment
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 1000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} className="bg-accent hover:bg-accent/90 text-accent-foreground">Add Fund</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
