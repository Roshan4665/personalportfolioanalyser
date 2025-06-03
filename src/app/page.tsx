
"use client";

import * as React from 'react';
import { analyzePortfolioAllocation } from '@/ai/flows/analyze-portfolio-allocation';
import type { MutualFund, PortfolioItem, AnalysisResult, AnalyzePortfolioAllocationInput } from '@/types';
import { parseCsvData } from '@/lib/csvParser';
import { getLocalCsvContent, getDefaultPortfolio } from '@/app/actions';
import { FundSearch } from '@/components/FundSearch';
import { AddFundDialog } from '@/components/AddFundDialog';
import { PortfolioManager } from '@/components/PortfolioManager';
import { AllocationPieChart } from '@/components/AllocationPieChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { FileText } from 'lucide-react';

const LOCAL_STORAGE_PORTFOLIO_KEY = 'fundFolioPortfolio';
const CDN_URL_CSV = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/mutual_funds.csv';
const CDN_URL_DEFAULT_PORTFOLIO = 'https://cdn.jsdelivr.net/gh/Roshan4665/personalportfolioanalyser/data/my_funds.json';


export default function HomePage() {
  const [allMutualFunds, setAllMutualFunds] = React.useState<MutualFund[]>([]);
  const [portfolio, setPortfolio] = React.useState<PortfolioItem[]>([]);
  const [selectedFundForDialog, setSelectedFundForDialog] = React.useState<MutualFund | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [isLoadingCsv, setIsLoadingCsv] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const loadInitialPortfolio = async () => {
      try {
        const storedPortfolioJson = localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_KEY);
        let loadedPortfolio: PortfolioItem[] | null = null;

        if (storedPortfolioJson) {
          try {
            const parsedPortfolio: PortfolioItem[] = JSON.parse(storedPortfolioJson);
            if (Array.isArray(parsedPortfolio) && parsedPortfolio.every(item => item.id && typeof item.weeklyInvestment === 'number')) {
              loadedPortfolio = parsedPortfolio;
            } else {
              console.warn("Malformed portfolio data in local storage, attempting to load default from CDN.");
              localStorage.removeItem(LOCAL_STORAGE_PORTFOLIO_KEY); 
            }
          } catch (error) {
            console.error("Error parsing portfolio from local storage:", error);
            localStorage.removeItem(LOCAL_STORAGE_PORTFOLIO_KEY); 
          }
        }

        if (loadedPortfolio && loadedPortfolio.length > 0) {
          setPortfolio(loadedPortfolio);
          toast({
            title: "Portfolio Loaded",
            description: "Your portfolio has been loaded from previous session.",
          });
        } else {
          toast({
            title: "Loading Default Portfolio",
            description: `No local portfolio found, attempting to load default funds from CDN: ${CDN_URL_DEFAULT_PORTFOLIO}.`,
          });
          const defaultPortfolioResult = await getDefaultPortfolio();
          if (defaultPortfolioResult && !('error' in defaultPortfolioResult)) {
            setPortfolio(defaultPortfolioResult);
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
            setPortfolio([]); 
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
  }, [toast]); 

  React.useEffect(() => {
    if (typeof window !== 'undefined' && (portfolio.length > 0 || localStorage.getItem(LOCAL_STORAGE_PORTFOLIO_KEY))) {
        localStorage.setItem(LOCAL_STORAGE_PORTFOLIO_KEY, JSON.stringify(portfolio));
    }
  }, [portfolio]);


  React.useEffect(() => {
    const loadData = async () => {
      setIsLoadingCsv(true);
      const result = await getLocalCsvContent();
      if (typeof result === 'string') {
        try {
          const funds = parseCsvData(result);
          setAllMutualFunds(funds);
          if (funds.length === 0 && result.trim() !== "") {
            toast({
              title: "CDN CSV Parsing Issue",
              description: `No valid fund data found in CSV from CDN: ${CDN_URL_CSV}. Please check its format and content.`,
              variant: "destructive",
            });
          } else if (funds.length > 0) {
             toast({
              title: "Fund Data Loaded",
              description: `Successfully loaded ${funds.length} funds from CDN CSV.`,
            });
          }
        } catch (error) {
          console.error("Error parsing CDN CSV data:", error);
          toast({
            title: "CDN CSV Parsing Error",
            description: `Failed to parse CSV from CDN: ${CDN_URL_CSV}. Please ensure it's correctly formatted.`,
            variant: "destructive",
          });
          setAllMutualFunds([]);
        }
      } else {
        toast({
          title: "Error Loading CDN CSV",
          description: result.error,
          variant: "destructive",
        });
        setAllMutualFunds([]);
      }
      setIsLoadingCsv(false);
    };
    loadData();
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
    setPortfolio(prev => [...prev, { ...fund, weeklyInvestment }]); 
    toast({
      title: "Fund Added",
      description: `${fund.name} added to your portfolio with ₹${weeklyInvestment.toLocaleString()} weekly investment.`, 
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
      const runAnalysis = async () => {
        setIsAnalyzing(true);
        try {
          const aiInput: AnalyzePortfolioAllocationInput = {
            portfolio: portfolio.map(p => ({
              name: p.name,
              largeCapHolding: p.percentLargecapHolding ?? 0,
              midCapHolding: p.percentMidcapHolding ?? 0,
              smallCapHolding: p.percentSmallcapHolding ?? 0,
              weeklyInvestment: p.weeklyInvestment, 
            })),
          };
          const result = await analyzePortfolioAllocation(aiInput);
          setAnalysisResult(result);
        } catch (error) {
          console.error("Error analyzing portfolio:", error);
          toast({
            title: "Analysis Error",
            description: "Could not analyze portfolio. Please try again later.",
            variant: "destructive",
          });
          setAnalysisResult(null);
        } finally {
          setIsAnalyzing(false);
        }
      };
      runAnalysis();
    } else {
      setAnalysisResult(null); 
    }
  }, [portfolio, toast]);

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8 font-body">
      <header className="flex justify-between items-center py-6">
        <div>
          <h1 className="font-headline text-5xl font-bold text-primary">
            FundFolio Analyzer
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Your mutual fund data is loaded from <code className="bg-muted px-1 py-0.5 rounded break-all">{CDN_URL_CSV}</code>. Build your portfolio and gain insights.
          </p>
        </div>
      </header>

      {isLoadingCsv && (
        <Card className="shadow-md">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent mb-6"></div>
            <h3 className="font-headline text-xl text-primary mb-2">Loading Fund Data...</h3>
            <p className="text-muted-foreground">Reading from <code className="bg-muted px-1 py-0.5 rounded break-all">{CDN_URL_CSV}</code>.</p>
          </CardContent>
        </Card>
      )}

      {!isLoadingCsv && allMutualFunds.length === 0 && (
        <Card className="shadow-md">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <FileText className="w-24 h-24 text-muted-foreground mb-6" />
            <h3 className="font-headline text-xl text-primary mb-2">No Fund Data Loaded</h3>
            <p className="text-muted-foreground">
              Could not load data from <code className="bg-muted px-1 py-0.5 rounded break-all">{CDN_URL_CSV}</code>.
              <br />
              Please ensure the URL is accessible and the file is correctly formatted.
            </p>
          </CardContent>
        </Card>
      )}
      
      {(portfolio.length > 0 || allMutualFunds.length > 0) && ( 
        <>
          <PortfolioManager
            portfolioItems={portfolio}
            onRemoveItem={handleRemoveFromPortfolio}
            onUpdateItemInvestment={handleUpdateWeeklyInvestment}
          />
          <div className="mt-8"> 
            <AllocationPieChart analysisResult={analysisResult} isLoading={isAnalyzing} />
          </div>
        </>
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

      <AddFundDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        fund={selectedFundForDialog}
        onAddFund={handleAddFundToPortfolio}
      />
    </div>
  );
}
