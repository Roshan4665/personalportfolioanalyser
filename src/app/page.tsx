
"use client";

import * as React from 'react';
import { analyzePortfolioAllocation } from '@/ai/flows/analyze-portfolio-allocation';
import type { MutualFund, PortfolioItem, AnalysisResult, AnalyzePortfolioAllocationInput, PortfolioAggregateStats } from '@/types';
// Removed parseCsvData import as it's used in actions.ts now
import { fetchAndProcessFundData, getDefaultPortfolio } from '@/app/actions';
import { FundSearch } from '@/components/FundSearch';
import { AddFundDialog } from '@/components/AddFundDialog';
import { PortfolioManager } from '@/components/PortfolioManager';
import { AllocationPieChart } from '@/components/AllocationPieChart';
import { PortfolioSummaryStats } from '@/components/PortfolioSummaryStats'; // New component
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { FileText, AlertTriangle } from 'lucide-react';

const LOCAL_STORAGE_PORTFOLIO_KEY = 'fundFolioPortfolio_v2'; // Changed key to avoid conflicts with old structure potentially
const CDN_URL_MF_BASE = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mutual_funds.csv';
const CDN_URL_MF1 = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mf1.csv';
const CDN_URL_MF2 = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mf2.csv';
const CDN_URL_DEFAULT_PORTFOLIO = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/my_funds.json';


export default function HomePage() {
  const [allMutualFunds, setAllMutualFunds] = React.useState<MutualFund[]>([]);
  const [portfolio, setPortfolio] = React.useState<PortfolioItem[]>([]);
  const [selectedFundForDialog, setSelectedFundForDialog] = React.useState<MutualFund | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [assetAllocationResult, setAssetAllocationResult] = React.useState<AnalysisResult | null>(null);
  const [portfolioAggStats, setPortfolioAggStats] = React.useState<PortfolioAggregateStats | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isLoadingFundData, setIsLoadingFundData] = React.useState(true);
  const [fundDataError, setFundDataError] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const loadInitialPortfolio = async () => {
      try {
        const storedPortfolioJson = localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_KEY);
        let loadedPortfolio: PortfolioItem[] | null = null;

        if (storedPortfolioJson) {
          try {
            const parsedPortfolio: PortfolioItem[] = JSON.parse(storedPortfolioJson);
            // Basic validation: check if it's an array and items have id, weeklyInvestment, and name
            if (Array.isArray(parsedPortfolio) && parsedPortfolio.every(item => item.id && typeof item.weeklyInvestment === 'number' && item.name)) {
              loadedPortfolio = parsedPortfolio;
            } else {
              console.warn("Malformed portfolio data in local storage, attempting to load default from CDN.");
              localStorage.removeItem(LOCAL_STORAGE_PORTFOLIO_KEY);
            }
          } catch (error) {
            console.error("Error parsing portfolio from local storage:", error);
            localStorage.removeItem(LOCAL_STORAGE_PORTFOLIO_KEY); // Clear corrupted data
          }
        }

        if (loadedPortfolio && loadedPortfolio.length > 0) {
          setPortfolio(loadedPortfolio);
          toast({
            title: "Portfolio Loaded",
            description: "Your portfolio has been loaded from the previous session.",
          });
        } else {
          toast({
            title: "Loading Default Portfolio",
            description: `No local portfolio found or data was malformed. Attempting to load default funds from CDN: ${CDN_URL_DEFAULT_PORTFOLIO}.`,
          });
          const defaultPortfolioResult = await getDefaultPortfolio();
          if (defaultPortfolioResult && !('error' in defaultPortfolioResult)) {
            setPortfolio(defaultPortfolioResult);
            // Default portfolio might not have all enriched data, it will be enriched when allMutualFunds are loaded
            localStorage.setItem(LOCAL_STORAGE_PORTFOLIO_KEY, JSON.stringify(defaultPortfolioResult));
            toast({
              title: "Default Portfolio Loaded",
              description: `Loaded ${defaultPortfolioResult.length} funds from CDN.`,
            });
          } else {
            toast({
              title: "Failed to Load Default Portfolio",
              description: defaultPortfolioResult?.error || "Could not load default funds from CDN.",
              variant: "destructive",
            });
            setPortfolio([]); // Ensure portfolio is empty if default load fails
          }
        }
      } catch (error) {
        console.error("Unexpected error loading initial portfolio:", error);
        toast({
          title: "Portfolio Load Error",
          description: "An unexpected error occurred while loading your portfolio.",
          variant: "destructive",
        });
        setPortfolio([]);
      }
    };
    loadInitialPortfolio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // Keep toast dependency

  // Save portfolio to local storage whenever it changes
  React.useEffect(() => {
    // Only save if portfolio has items or if there was something previously in local storage (to clear it if it becomes empty)
    if (typeof window !== 'undefined' && (portfolio.length > 0 || localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_KEY))) {
        localStorage.setItem(LOCAL_STORAGE_PORTFOLIO_KEY, JSON.stringify(portfolio));
    }
  }, [portfolio]);


  React.useEffect(() => {
    const loadAllFundData = async () => {
      setIsLoadingFundData(true);
      setFundDataError(null);
      const result = await fetchAndProcessFundData();
      if (result && !('error' in result)) {
        setAllMutualFunds(result);
        if (result.length === 0) {
          toast({
            title: "No Fund Data",
            description: `No fund data could be loaded from CDN sources. The app might not function as expected.`,
            variant: "destructive",
          });
          setFundDataError("No fund data could be loaded from any CDN source.");
        } else {
           toast({
            title: "Fund Data Loaded",
            description: `Successfully loaded and merged data for ${result.length} funds from CDN.`,
          });
          // Enrich portfolio items with potentially new data from allMutualFunds
          setPortfolio(prevPortfolio => 
            prevPortfolio.map(pItem => {
              const fullFundData = result.find(mf => mf.name === pItem.name || mf.id === pItem.id); // Match by name or id
              return fullFundData ? { ...fullFundData, weeklyInvestment: pItem.weeklyInvestment } : pItem;
            })
          );
        }
      } else {
        const errorMsg = result?.error || "An unknown error occurred while fetching fund data.";
        toast({
          title: "Error Loading Fund Data",
          description: errorMsg,
          variant: "destructive",
        });
        setFundDataError(errorMsg);
        setAllMutualFunds([]);
      }
      setIsLoadingFundData(false);
    };
    loadAllFundData();
  }, [toast]);

  const handleOpenAddDialog = (fund: MutualFund) => {
    setSelectedFundForDialog(fund);
    setIsDialogOpen(true);
  };

  const handleAddFundToPortfolio = (fund: MutualFund, weeklyInvestment: number) => {
    if (portfolio.find(item => item.id === fund.id)) {
       toast({
        title: "Fund Exists",
        description: `${fund.name} is already in your portfolio.`,
        variant: "default",
      });
      return;
    }
    // Ensure the fund object added to portfolio has all fields from allMutualFunds
    const fullFundData = allMutualFunds.find(mf => mf.id === fund.id);
    const itemToAdd = fullFundData ? { ...fullFundData, weeklyInvestment } : { ...fund, weeklyInvestment };

    setPortfolio(prev => [...prev, itemToAdd]);
    toast({
      title: "Fund Added",
      description: `${fund.name} added with ₹${weeklyInvestment.toLocaleString()} weekly.`,
    });
  };

  const handleRemoveFromPortfolio = (fundId: string) => {
    const removedFund = portfolio.find(item => item.id === fundId);
    setPortfolio(prev => prev.filter(item => item.id !== fundId));
    if (removedFund) {
      toast({
        title: "Fund Removed",
        description: `${removedFund.name} removed from your portfolio.`,
      });
    }
  };

  const handleUpdateWeeklyInvestment = (fundId: string, newAmount: number) => {
    const updatedPortfolio = portfolio.map(item =>
      item.id === fundId ? { ...item, weeklyInvestment: newAmount } : item
    );
    setPortfolio(updatedPortfolio);
    const updatedFund = updatedPortfolio.find(item => item.id === fundId);
    if (updatedFund) {
      toast({
        title: "Investment Updated",
        description: `Weekly investment for ${updatedFund.name} updated to ₹${newAmount.toLocaleString()}.`,
      });
    }
  };

  // Calculate Aggregate Portfolio Stats
  React.useEffect(() => {
    if (portfolio.length > 0) {
      let totalInvestment = 0;
      let totalWeightedExpense = 0;
      let totalWeightedCagr3y = 0;
      let fundsWithExpenseRatio = 0;
      let fundsWithCagr3y = 0;

      portfolio.forEach(fund => {
        totalInvestment += fund.weeklyInvestment;
        if (typeof fund.expenseRatio === 'number') {
          totalWeightedExpense += fund.expenseRatio * fund.weeklyInvestment;
          fundsWithExpenseRatio++;
        }
        if (typeof fund.cagr3y === 'number') {
          totalWeightedCagr3y += fund.cagr3y * fund.weeklyInvestment;
          fundsWithCagr3y++;
        }
      });

      setPortfolioAggStats({
        weightedAverageExpenseRatio: totalInvestment > 0 && fundsWithExpenseRatio > 0 ? totalWeightedExpense / totalInvestment : null,
        weightedAverageCagr3y: totalInvestment > 0 && fundsWithCagr3y > 0 ? totalWeightedCagr3y / totalInvestment : null,
      });

    } else {
      setPortfolioAggStats(null);
    }
  }, [portfolio]);


  React.useEffect(() => {
    if (portfolio.length > 0) {
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const analysisInput: AnalyzePortfolioAllocationInput = {
            portfolio: portfolio.map(p => ({
              name: p.name,
              largeCapHolding: p.percentLargecapHolding ?? 0,
              midCapHolding: p.percentMidcapHolding ?? 0,
              smallCapHolding: p.percentSmallcapHolding ?? 0,
              weeklyInvestment: p.weeklyInvestment,
            })),
          };
          const result = await analyzePortfolioAllocation(analysisInput);
          setAssetAllocationResult(result);
        } catch (error) {
          console.error("Error analyzing portfolio asset allocation:", error);
          toast({
            title: "Asset Allocation Analysis Error",
            description: "Could not analyze portfolio asset allocation.",
            variant: "destructive",
          });
          setAssetAllocationResult(null);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    } else {
      setAssetAllocationResult(null); // Clear analysis if portfolio is empty
    }
  }, [portfolio, toast]);

  const cdnSourcesMessage = `Fund data is loaded from CDN sources: ${CDN_URL_MF_BASE}, ${CDN_URL_MF1}, and ${CDN_URL_MF2}.`;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 font-body">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="font-headline text-5xl font-bold text-primary">
            FundFolio Analyzer
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {cdnSourcesMessage} Build your portfolio and gain insights.
          </p>
        </div>
      </header>

      {isLoadingFundData && (
        <Card className="shadow-md">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mb-6"></div>
            <h3 className="font-headline text-xl text-primary mb-2">Loading All Fund Data...</h3>
            <p className="text-muted-foreground max-w-md">Fetching and merging data from CDN sources. This may take a moment.</p>
          </CardContent>
        </Card>
      )}

      {!isLoadingFundData && fundDataError && (
        <Card className="shadow-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center"><AlertTriangle className="mr-2" /> Fund Data Load Failed</CardTitle>
          </CardHeader>
          <CardContent className="py-8 flex flex-col items-center justify-center text-center">
            <FileText className="w-20 h-20 text-destructive/70 mb-4" />
            <p className="text-destructive/90">
              Could not load essential fund data from CDN sources.
            </p>
            <p className="text-sm text-muted-foreground mt-1">{fundDataError}</p>
            <p className="text-sm text-muted-foreground mt-2">Please check your internet connection and ensure the CDN URLs are accessible. The application functionality will be limited.</p>
          </CardContent>
        </Card>
      )}
      
      {!isLoadingFundData && !fundDataError && (
        <>
          {portfolio.length > 0 && (
            <>
              <PortfolioSummaryStats stats={portfolioAggStats} />
              <PortfolioManager
                portfolioItems={portfolio}
                onRemoveItem={handleRemoveFromPortfolio}
                onUpdateItemInvestment={handleUpdateWeeklyInvestment}
              />
              <div className="mt-8">
                <AllocationPieChart analysisResult={assetAllocationResult} isLoading={isAnalyzing} />
              </div>
            </>
          )}

          {portfolio.length === 0 && allMutualFunds.length > 0 && (
             <Card className="shadow-md">
                <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                    <h3 className="font-headline text-xl text-primary mb-2">Your Portfolio is Empty</h3>
                    <p className="text-muted-foreground">Search for funds below and add them to start analyzing.</p>
                </CardContent>
            </Card>
          )}
        
          {allMutualFunds.length > 0 && (
            <>
              <Separator className="my-8" />
              <Card className="shadow-md">
                 <CardHeader>
                    <CardTitle className="font-headline text-2xl text-primary">Search & Add Funds</CardTitle>
                    <CardDescription>Find funds from the loaded CDN data and add them to your portfolio.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FundSearch
                    allFunds={allMutualFunds}
                    onAddToPortfolio={handleOpenAddDialog}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {!isLoadingFundData && allMutualFunds.length === 0 && !fundDataError && (
         <Card className="shadow-md">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <FileText className="w-24 h-24 text-muted-foreground mb-6" />
            <h3 className="font-headline text-xl text-primary mb-2">No Fund Data Available</h3>
            <p className="text-muted-foreground">
              Successfully connected to CDN, but no fund data was returned or data was malformed.
            </p>
          </CardContent>
        </Card>
      )}

      <AddFundDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        fund={selectedFundForDialog}
        onAddFund={handleAddFundToPortfolio}
      />
    </div>
  );
}
