'use client';

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { GitMerge, Loader2 } from 'lucide-react';
import type { GenerationParams, AnalysisSummary } from '@/lib/types';
import { performanceThresholds } from '@/lib/config';
import { StudentDatasetContainerSchema } from '@/lib/schemas';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { MergeSidebar } from '@/components/app/merge-sidebar';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppShell } from '@/components/app/app-shell';

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
  const [downloadFilename, setDownloadFilename] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [plotPoints, setPlotPoints] = useState<number>(80);
  const [analysisThresholds, setAnalysisThresholds] = useState({
    high: performanceThresholds.high,
    mid: performanceThresholds.mid,
  });
  const { toast } = useToast();

  const validateDatasetFile = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const result = StudentDatasetContainerSchema.safeParse(parsed);
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
    setDownloadFilename(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    formData.append('plotPoints', plotPoints.toString());
    formData.append('perfHigh', analysisThresholds.high.toString());
    formData.append('perfMid', analysisThresholds.mid.toString());

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
      setDownloadFilename(camelCaseResult.downloadFilename || null);

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


  return (
    <AppShell
      title="Merge & Analyze"
      icon={<GitMerge className="h-4 w-4 text-primary" />}
      pathname={location.pathname}
      sidebar={(
        <MergeSidebar 
          onMerge={handleMerge} 
          onFileChange={handleFileChange}
          mergedStudentsCount={summary?.totalStudents || 0}
          downloadPath={downloadPath}
          downloadFilename={downloadFilename}
          analysisThresholds={analysisThresholds}
          onAnalysisThresholdsChange={setAnalysisThresholds}
          isLoading={isLoading}
        />
      )}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
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
    </AppShell>
  );
}
