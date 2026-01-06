import * as React from "react";
import { generateDataAction } from "@/app/actions";
import type { GenerationParams, GenerationResult } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ParameterSidebar } from "@/components/app/parameter-sidebar";
import { Dashboard } from "@/components/app/dashboard";
import { Logo } from "@/components/app/logo";
import { Download, BotMessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const defaultParams: GenerationParams = {
  numStudents: 100,
  creditsPerSubject: 3,
  minCredit: 9,
  stdCredit: 15,
  maxCredit: 24,
  maxCreditImpact: 0.07,
  highPerformanceChance: 0.15,
  failChance: 0.05,
};

export function MainPage() {
  const [params, setParams] = React.useState<GenerationParams>(defaultParams);
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerate = React.useCallback(async () => {
    console.log('Generating data with params:', params);
    setIsLoading(true);
    try {
      const generationResult = await generateDataAction(params);
      setResult(generationResult);
      toast({
        title: "Success",
        description: `Generated data for ${generationResult.data.length} students.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [params, toast]);
  
  React.useEffect(() => {
    handleGenerate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleDownload = () => {
    if (!result || result.data.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to download",
        description: "Please generate a dataset first.",
      });
      return;
    }
    const dataStr = JSON.stringify(result.data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.download = "synthetic_student_dataset.json";
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Started",
      description: "Your dataset is being downloaded.",
    });
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r-0">
        <ParameterSidebar
          params={params}
          setParams={setParams}
          onGenerate={handleGenerate}
          onDownload={handleDownload}
          isLoading={isLoading}
        />
      </Sidebar>
      <SidebarInset className="min-h-screen">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <Logo />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {result ? (
            <Dashboard result={result} isLoading={isLoading} />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                           <BotMessageSquare className="h-8 w-8 text-primary"/> Welcome to DataForge AI
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">
                            Adjust the parameters in the sidebar and click "Generate Data" to create your first synthetic dataset.
                        </p>
                        <Button onClick={handleGenerate} disabled={isLoading}>
                            {isLoading ? "Generating..." : "Generate Initial Data"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
