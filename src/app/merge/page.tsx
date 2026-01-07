'use client';

import { useState } from 'react';
import type { Student, GenerationParams, AnalysisSummary, StudentWithCgpa } from '@/lib/types';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { MergeSidebar } from '@/components/app/merge-sidebar';
import { useToast } from '@/hooks/use-toast';

export default function MergePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [mergedStudents, setMergedStudents] = useState<StudentWithCgpa[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [params, setParams] = useState<GenerationParams | null>(null);
  const { toast } = useToast();

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
        throw new Error('Failed to merge files');
      }

      const result = await response.json();

      setParams(result.params);
      setSummary(result.summary);
      setMergedStudents(result.students);
      setInsights(result.insights);

      toast({
        title: "Merge Successful",
        description: `Successfully merged and analyzed ${files.length} files.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Merge Failed",
        description: (error as Error).message,
      });
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

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-96 h-full overflow-y-auto border-r">
        <MergeSidebar 
            onMerge={handleMerge} 
            onDownload={handleDownload} 
            onFileChange={handleFileChange}
            onTrim={handleTrim}
            mergedStudentsCount={mergedStudents.length} 
        />
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-4">
            <h1 className="text-2xl font-bold">Merge and Analyze Datasets</h1>
        </div>
        {mergedStudents.length > 0 && summary && params ? (
            <AcademicPerformance students={mergedStudents} summary={summary} params={params} insights={insights} />
        ) : (
            <div className="flex items-center justify-center h-full text-center p-8 border rounded-lg bg-card">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Welcome to the Merge Page</h2>
                    <p className="text-muted-foreground mb-4">
                        Here you can combine multiple student dataset files (JSON format) into a single dataset for a comprehensive analysis.
                    </p>
                    <p className="text-muted-foreground">
                        Use the sidebar to upload your files, merge them, and then download the combined dataset. You can also trim the data based on CGPA and percentage.
                    </p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
