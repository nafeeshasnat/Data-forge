'use client';

import * as React from 'react';
import { generateSyntheticData } from '@/lib/data-generator';
import { AnalysisEngine } from '@/lib/engine/analysis-engine';
import type { GenerationParams, StudentWithCgpa, AnalysisSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ParameterSidebar } from '@/components/app/parameter-sidebar';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { Logo } from '@/components/app/logo';
import { Download, BotMessageSquare, GitMerge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export function MainPage() {
  const [students, setStudents] = React.useState<StudentWithCgpa[]>([]);
  const [summary, setSummary] = React.useState<AnalysisSummary | null>(null);
  const [params, setParams] = React.useState<GenerationParams | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerate = React.useCallback(async (params: GenerationParams) => {
    setIsLoading(true);
    setParams(params);
    try {
      // 1. Generate synthetic data (stochastic)
      const generatedStudents = generateSyntheticData(params);
      
      // 2. Analyze the data (deterministic)
      const engine = new AnalysisEngine(generatedStudents, params);
      const { data, summary } = engine.run();

      setStudents(data);
      setSummary(summary);

      toast({
        title: "Success",
        description: `Generated and analyzed data for ${data.length} students.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate or analyze data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const handleDownload = () => {
    if (students.length === 0 || !summary || !params) {
      toast({
        variant: "destructive",
        title: "No data to download",
        description: "Please generate a dataset first.",
      });
      return;
    }

    const dataToDownload = {
      params,
      summary,
      students,
    };

    const dataStr = JSON.stringify(dataToDownload, null, 2);
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
        <ParameterSidebar onGenerate={handleGenerate} isGenerating={isLoading} />
      </Sidebar>
      <SidebarInset className="min-h-screen md:ml-96">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <Logo />
          </div>
          <div className="flex items-center gap-2">
            <Link to="/merge">
              <Button variant="outline" size="icon">
                <GitMerge className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="outline" size="icon" onClick={handleDownload} disabled={students.length === 0 || isLoading}>
              <Download className="h-4 w-4"/>
            </Button>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {students.length > 0 && summary && params ? (
            <AcademicPerformance students={students} summary={summary} params={params} />
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
