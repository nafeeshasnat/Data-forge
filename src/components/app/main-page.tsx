
'use client';

import * as React from 'react';
import { generateSyntheticData } from '@/lib/data-generator';
import { AnalysisEngine } from '@/lib/engine/analysis-engine';
import type { GenerationParams, Student, StudentWithCgpa, AnalysisSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Sidebar, SidebarContent, SidebarHeader, SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ParameterSidebar } from '@/components/app/parameter-sidebar';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { Logo } from '@/components/app/logo';
import { BotMessageSquare, GitMerge, Download, Scissors, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link, useLocation } from 'react-router-dom';

// This function takes the detailed student data and strips it down to the core Student type.
function getCleanStudentData(student: StudentWithCgpa): Student {
  const {
    // These fields are calculated by the AnalysisEngine and are not part of the base data.
    cgpa,
    performanceGroup,
    avgCreditLoad,
    avgAttendance,
    semesterDetails,
    // The rest of the properties are kept.
    ...rest
  } = student;
  return rest;
}

export function MainPage() {
  const location = useLocation();
  const [students, setStudents] = React.useState<StudentWithCgpa[]>([]);
  const [summary, setSummary] = React.useState<AnalysisSummary | null>(null);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [params, setParams] = React.useState<GenerationParams | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGenerate = React.useCallback(async (params: GenerationParams) => {
    setIsLoading(true);
    setParams(params);
    try {
      const generatedStudents = generateSyntheticData(params);
      const engine = new AnalysisEngine(generatedStudents, params);
      const { data, summary, insights } = engine.run();

      setStudents(data);
      setSummary(summary);
      setInsights(insights);

      toast({
        title: "Success",
        description: `Generated and analyzed data for ${data.length} students.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate or analyze data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  
  const handleTrim = React.useCallback((minCgpa: number, maxCgpa: number, percentage: number) => {
    if (students.length === 0 || !params) {
      toast({
        variant: "destructive",
        title: "No data to trim",
        description: "Please generate a dataset first.",
      });
      return;
    }

    const engine = new AnalysisEngine(students, params);
    const trimmedStudents = engine.trimData(minCgpa, maxCgpa, percentage);
    
    const newEngine = new AnalysisEngine(trimmedStudents, params);
    const { data, summary, insights } = newEngine.run();

    setStudents(data);
    setSummary(summary);
    setInsights(insights);

    toast({
      title: "Data Trimmed",
      description: `Removed ${students.length - data.length} students.`
    });
  }, [students, params, toast]);

  const handleDownload = () => {
    if (students.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to download",
        description: "Please generate a dataset first.",
      });
      return;
    }

    // Create a clean version of the data for download, removing analysis-specific fields.
    const cleanStudents = students.map(getCleanStudentData);

    const dataStr = JSON.stringify(cleanStudents, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const uniqueId = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    a.download = `generated_${cleanStudents.length}_students_${uniqueId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <SidebarProvider>
      <Sidebar className="border-r-0 md:w-96 md:border-r">
        <SidebarHeader className="border-b p-4">
          <Logo />
        </SidebarHeader>
        <SidebarContent className="p-4 space-y-4">
          <ParameterSidebar onGenerate={handleGenerate} isGenerating={isLoading} onTrim={handleTrim} isDataPresent={students.length > 0} />
          <Card>
            <CardHeader>
              <CardTitle>Download Dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleDownload} disabled={students.length === 0} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download JSON
              </Button>
            </CardContent>
          </Card>
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-h-screen md:ml-96">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <BotMessageSquare className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold">Generate Dataset</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden items-center gap-2 md:flex">
              <Button asChild variant={isActive('/') ? "secondary" : "ghost"} size="icon" aria-label="Go to Generate" title="Generate">
                <Link to="/" aria-current={isActive('/') ? "page" : undefined}>
                  <BotMessageSquare className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant={isActive('/single') ? "secondary" : "ghost"} size="icon" aria-label="Go to Single Student" title="Single Student">
                <Link to="/single" aria-current={isActive('/single') ? "page" : undefined}>
                  <User className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant={isActive('/trim') ? "secondary" : "ghost"} size="icon" aria-label="Go to Trim" title="Trim">
                <Link to="/trim" aria-current={isActive('/trim') ? "page" : undefined}>
                  <Scissors className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant={isActive('/merge') ? "secondary" : "ghost"} size="icon" aria-label="Go to Merge" title="Merge">
                <Link to="/merge" aria-current={isActive('/merge') ? "page" : undefined}>
                  <GitMerge className="h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {students.length > 0 && summary && params ? (
            <AcademicPerformance students={students} summary={summary} params={params} insights={insights} />
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
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
