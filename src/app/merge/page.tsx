'use client';

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BotMessageSquare, GitMerge, Loader2, Scissors, User } from 'lucide-react';
import type { GenerationParams, AnalysisSummary } from '@/lib/types';
import { StudentDatasetSchema } from '@/lib/schemas';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { MergeSidebar } from '@/components/app/merge-sidebar';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/app/logo';
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

// Function to convert snake_case keys to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, (group) =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

export default function MergePage() {
  const location = useLocation();
  const [files, setFiles] = useState<FileList | null>(null);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [params, setParams] = useState<GenerationParams | null>(null);
  const [downloadPath, setDownloadPath] = useState<string | null>(null);
  const [plainText, setPlainText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plotPoints, setPlotPoints] = useState<number>(80);
  const { toast } = useToast();

  const validateDatasetFile = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const result = StudentDatasetSchema.safeParse(parsed);
    return result.success;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      setFiles(null);
      return;
    }

    try {
      const validations = await Promise.all(Array.from(selectedFiles, validateDatasetFile));
      if (validations.some((isValid) => !isValid)) {
        toast({
          variant: "destructive",
          title: "Invalid dataset file",
          description: "One or more files do not match the expected student dataset schema.",
        });
        setFiles(null);
        return;
      }
      setFiles(selectedFiles);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to read file",
        description: "Please upload valid JSON datasets.",
      });
      setFiles(null);
    }
  };

  const handleMerge = async () => {
    if (!files || files.length === 0) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please select one or more JSON files to merge.",
      });
      return;
    }

    setIsLoading(true);
    setSummary(null);
    setInsights([]);
    setDownloadPath(null);
    setPlainText('');

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('plotPoints', plotPoints.toString());

    try {
      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Merge failed with status:", response.status, "and message:", errorText);
        throw new Error(`Failed to merge files: ${errorText}`);
      }

      const result = await response.json();
      const camelCaseResult = toCamelCase(result);

      setParams(camelCaseResult.params || null);
      setSummary(camelCaseResult.summary || null);
      setInsights(camelCaseResult.insights || []);
      setDownloadPath(camelCaseResult.downloadPath || null);

      toast({
        title: "Merge Successful",
        description: `Successfully merged and analyzed ${files.length} files.`,
      });
    } catch (error) {
        console.error("An error occurred during merge:", error);
        toast({
            variant: "destructive",
            title: "An error occurred during merge",
            description: (error as Error).message,
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJsonToText = async (file: File) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please select a JSON file to convert.",
      });
      return;
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/json-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to convert file: ${response.statusText} - ${errorText}`);
      }

      const result = await response.text();
      setPlainText(result);
      setSummary(null);
      setInsights([]);
      setParams(null);
      setDownloadPath(null);

      toast({
        title: "Conversion Successful",
        description: "Successfully converted JSON file to plain text.",
      });
    } catch (error) {
      console.error("An error occurred during conversion:", error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: (error as Error).message,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleTrim = (minCgpa: number, maxCgpa: number, percentage: number) => {
    toast({
      variant: "destructive",
      title: "Not Implemented",
      description: "Trimming is not yet supported with backend processing.",
    });
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
        <SidebarContent className="p-4">
          <MergeSidebar 
            onMerge={handleMerge} 
            onFileChange={handleFileChange}
            onJsonToText={handleJsonToText}
            onTrim={handleTrim}
            mergedStudentsCount={summary?.totalStudents || 0}
            downloadPath={downloadPath}
            isLoading={isLoading}
          />
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-h-screen md:ml-96">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold">Merge & Analyze</h1>
            </div>
          </div>
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
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : plainText ? (
            <Card>
              <CardHeader>
                <CardTitle>JSON as Plain Text</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={plainText} readOnly rows={20} className="w-full p-2 font-mono" />
              </CardContent>
            </Card>
          ) : summary ? (
            <AcademicPerformance students={[]} summary={summary} params={params} insights={insights} isMergePage={true} />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
              <Card className="w-full max-w-md text-center">
                <CardHeader>
                  <CardTitle className="text-2xl">Merge Datasets</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Combine multiple JSON datasets for a single analysis or convert a JSON file to plain text.
                  </p>
                  <p className="text-muted-foreground">
                    Use the sidebar to upload your files, merge them, convert to text, and download the result.
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
