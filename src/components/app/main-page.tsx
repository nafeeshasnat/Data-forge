
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


export function MainPage() {
  const [result, setResult] = React.useState<GenerationResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerate = React.useCallback(async (params: GenerationParams) => {
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
  }, [toast]);
  
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
        <Sidebar className="border-r-0 md:w-96 md:border-r">
            <ParameterSidebar
                onGenerate={handleGenerate}
                isGenerating={isLoading}
            />
        </Sidebar>
        <SidebarInset className="min-h-screen md:ml-96">
            <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
                <div className="flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <Logo />
                </div>
                <Button variant="outline" size="icon" onClick={handleDownload} disabled={!result || isLoading}>
                    <Download className="h-4 w-4"/>
                </Button>
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
                            <p className="text-sm text-muted-foreground">
                            Once data is generated, you can download it using the button in the header.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
            </main>
        </SidebarInset>
    </SidebarProvider>
  );
}
