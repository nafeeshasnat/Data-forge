'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { Student, GenerationParams, AnalysisSummary, StudentWithCgpa } from '@/lib/types';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { MergeSidebar } from '@/components/app/merge-sidebar';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MergePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [mergedStudents, setMergedStudents] = useState<StudentWithCgpa[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [params, setParams] = useState<GenerationParams | null>(null);
  const [plainText, setPlainText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
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
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Merge failed with status:", response.status, "and message:", errorText);
        throw new Error(`Failed to merge files: ${response.statusText}`);
      }

      const result = await response.json();
      
      setParams(result.params || null);
      setSummary(result.summary || null);
      setMergedStudents(result.students || []);
      setInsights(result.insights || []);
      setPlainText(''); // Clear plain text view

      toast({
        title: "Merge Successful",
        description: `Successfully merged and analyzed ${files.length} files.`,
      });
    } catch (error) {
        console.error("An error occurred during merge:", error);
        toast({
            variant: "destructive",
            title: "Merge Failed",
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
      setMergedStudents([]); // Clear merge view
      setSummary(null);
      setInsights([]);
      setParams(null);

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

  const handleDownload = () => {
    if (mergedStudents.length === 0) {
      toast({
        variant: "destructive",
        title: "No data to download",
        description: "Please merge some datasets first.",
      });
      return;
    }

    const dataToDownload = {
      params: params,
      summary: summary,
      insights: insights,
      students: mergedStudents
    };

    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merged_dataset.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Download Started",
      description: "Your merged dataset is being downloaded.",
    });
  };

  const handleTrim = (minCgpa: number, maxCgpa: number, percentage: number) => {
    toast({
      variant: "destructive",
      title: "Not Implemented",
      description: "Trimming is not yet supported with backend processing.",
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-96 h-full overflow-y-auto border-r">
        <MergeSidebar 
            onMerge={handleMerge} 
            onDownload={handleDownload} 
            onFileChange={handleFileChange}
            onJsonToText={handleJsonToText}
            onTrim={handleTrim}
            mergedStudentsCount={mergedStudents ? mergedStudents.length : 0} 
            isLoading={isLoading}
        />
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Merge and Analyze Datasets</h1>
            <Button onClick={handleBack} variant="outline">Back to Main</Button>
        </div>
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
        ) : (mergedStudents && mergedStudents.length > 0 && summary) ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Students
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {mergedStudents.length}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <AcademicPerformance students={mergedStudents} summary={summary} params={params} insights={insights} isMergePage={true} />
            </>
        ) : (
            <div className="flex items-center justify-center h-full text-center p-8 border rounded-lg bg-card">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Welcome to the Merge Page</h2>
                    <p className="text-muted-foreground mb-4">
                        Here you can combine multiple student dataset files (JSON format) into a single dataset for a comprehensive analysis or convert a single JSON file to plain text.
                    </p>
                    <p className="text-muted-foreground">
                        Use the sidebar to upload your files, merge them, convert to text, and then download the combined dataset. You can also trim the data based on CGPA and percentage.
                    </p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
