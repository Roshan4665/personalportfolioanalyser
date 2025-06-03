
"use client";

import * as React from 'react';
import { analyzePortfolioAllocation } from '@/ai/flows/analyze-portfolio-allocation';
import type { MutualFund, PortfolioItem, AnalysisResult, AnalyzePortfolioAllocationInput, PortfolioAggregateStats } from '@/types';
import { fetchAndProcessFundData, getDefaultPortfolio, fetchRemotePortfolio, saveRemotePortfolio } from '@/app/actions';
import { FundSearch } from '@/components/FundSearch';
import { AddFundDialog } from '@/components/AddFundDialog';
import { PortfolioManager } from '@/components/PortfolioManager';
import { AllocationPieChart } from '@/components/AllocationPieChart';
import { PortfolioSummaryStats } from '@/components/PortfolioSummaryStats';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { FileText, AlertTriangle, CloudUpload, CloudDownload } from 'lucide-react';

const CDN_URL_MF_BASE = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mutual_funds.csv';
const CDN_URL_MF1 = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mf1.csv';
const CDN_URL_MF2 = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mf2.csv';
const CDN_URL_DEFAULT_PORTFOLIO_FALLBACK = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/my_funds.json'; // Fallback if npoint fails

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
  const [isInitialPortfolioLoadComplete, setIsInitialPortfolioLoadComplete] = React.useState(false);
  const [isSavingPortfolio, setIsSavingPortfolio] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    const loadInitialPortfolio = async () => {
      setIsInitialPortfolioLoadComplete(false);
      let loadedPortfolio: PortfolioItem[] | null = null;

      toast({ title: "Loading Portfolio", description: "Fetching your portfolio from npoint.io..." });
      const remotePortfolioResult = await fetchRemotePortfolio();

      if (remotePortfolioResult && !('error' in remotePortfolioResult) && remotePortfolioResult.length > 0) {
        loadedPortfolio = remotePortfolioResult;
        toast({
          title: "Portfolio Loaded Remotely",
          description: "Your portfolio has been loaded from npoint.io.",
        });
      } else {
        if (remotePortfolioResult && 'error' in remotePortfolioResult) {
          toast({ title: "Remote Load Failed", description: `Could not load from npoint.io: ${remotePortfolioResult.error}. Falling back to default portfolio from CDN.`, variant: "destructive" });
        } else {
          toast({ title: "Empty Remote Portfolio", description: `No portfolio found at npoint.io or it's malformed. Loading default portfolio from CDN: ${CDN_URL_DEFAULT_PORTFOLIO_FALLBACK}.`, variant: "default" });
        }
        
        const defaultPortfolioResult = await getDefaultPortfolio(); // Fetches from jsdelivr CDN
        if (defaultPortfolioResult && !('error' in defaultPortfolioResult)) {
          loadedPortfolio = defaultPortfolioResult;
          toast({
            title: "Default Portfolio Loaded",
            description: `Loaded ${defaultPortfolioResult.length} funds from CDN. Attempting to save this as your remote portfolio.`,
          });
          // Attempt to save this default to npoint.io immediately
          setIsSavingPortfolio(true);
          const saveResult = await saveRemotePortfolio(defaultPortfolioResult);
          setIsSavingPortfolio(false);
          if (saveResult && 'error' in saveResult) {
            toast({ title: "Failed to Save Default Remotely", description: `Could not save default portfolio to npoint.io: ${saveResult.error}`, variant: "destructive" });
          } else {
            toast({ title: "Default Portfolio Saved Remotely", description: "Default portfolio saved to npoint.io for future use." });
          }
        } else {
          toast({
            title: "Failed to Load Default Portfolio",
            description: defaultPortfolioResult?.error || "Could not load default funds from CDN fallback.",
            variant: "destructive",
          });
          loadedPortfolio = []; 
        }
      }
      setPortfolio(loadedPortfolio || []);
      setIsInitialPortfolioLoadComplete(true);
    };
    loadInitialPortfolio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);

  // Save portfolio to npoint.io whenever it changes AFTER initial load
  React.useEffect(() => {
    const persistPortfolio = async () => {
      if (isInitialPortfolioLoadComplete && !isLoadingFundData) { // Only save after initial load and fund data load
        setIsSavingPortfolio(true);
        toast({ title: "Saving Portfolio...", description: "Syncing your portfolio with npoint.io.", icon: <CloudUpload className="h-5 w-5 animate-pulse" /> });
        const result = await saveRemotePortfolio(portfolio);
        setIsSavingPortfolio(false);
        if (result && 'error' in result) {
          toast({ title: "Remote Save Failed", description: `Could not save portfolio to npoint.io: ${result.error}`, variant: "destructive" });
        } else {
          toast({ title: "Portfolio Saved Remotely", description: "Your portfolio is synced with npoint.io.", icon: <CloudDownload className="h-5 w-5 text-green-500" /> });
        }
      }
    };

    const timerId = setTimeout(() => {
      persistPortfolio();
    }, 1500); // Debounce saving by 1.5 seconds

    return () => clearTimeout(timerId);

  }, [portfolio, isInitialPortfolioLoadComplete, isLoadingFundData, toast]);


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
          // This should happen AFTER portfolio is loaded
          setPortfolio(prevPortfolio => 
            prevPortfolio.map(pItem => {
              const fullFundData = result.find(mf => mf.name === pItem.name || mf.id === pItem.id);
              return fullFundData ? { ...pItem, ...fullFundData, weeklyInvestment: pItem.weeklyInvestment } : pItem;
            }).filter(Boolean) as PortfolioItem[]
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
    if (portfolio.length > 0 && isInitialPortfolioLoadComplete) {
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
      setAssetAllocationResult(null); 
    }
  }, [portfolio, toast, isInitialPortfolioLoadComplete]);

  const cdnSourcesMessage = `Fund data is loaded from CDN sources: ${CDN_URL_MF_BASE}, ${CDN_URL_MF1}, and ${CDN_URL_MF2}.`;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 font-body">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="font-headline text-5xl font-bold text-primary">
            FundFolio Analyzer
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            {cdnSourcesMessage} Build your portfolio and gain insights. Portfolio stored on npoint.io.
          </p>
        </div>
      </header>

      {(isLoadingFundData || !isInitialPortfolioLoadComplete) && (
        <Card className="shadow-md">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mb-6"></div>
            <h3 className="font-headline text-xl text-primary mb-2">
              {isLoadingFundData ? "Loading All Fund Data..." : "Loading Your Portfolio..."}
            </h3>
            <p className="text-muted-foreground max-w-md">
              {isLoadingFundData ? "Fetching and merging data from CDN sources." : "Accessing your portfolio from remote storage."} This may take a moment.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoadingFundData && isInitialPortfolioLoadComplete && fundDataError && (
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
      
      {!isLoadingFundData && isInitialPortfolioLoadComplete && !fundDataError && (
        <>
          {portfolio.length > 0 && (
            <>
              <PortfolioSummaryStats stats={portfolioAggStats} />
              <PortfolioManager
                portfolioItems={portfolio}
                onRemoveItem={handleRemoveFromPortfolio}
                onUpdateItemInvestment={handleUpdateWeeklyInvestment}
                isSaving={isSavingPortfolio}
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
                    <p className="text-muted-foreground">Search for funds below and add them to start analyzing. Your changes will be saved to npoint.io.</p>
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

      {!isLoadingFundData && isInitialPortfolioLoadComplete && allMutualFunds.length === 0 && !fundDataError && (
         <Card className="shadow-md">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <FileText className="w-24 h-24 text-muted-foreground mb-6" />
            <h3 className="font-headline text-xl text-primary mb-2">No Fund Data Available</h3>
            <p className="text-muted-foreground">
              Successfully connected to CDN, but no fund data was returned or data was malformed. Cannot search for funds.
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

