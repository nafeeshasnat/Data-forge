'use client';

import { useState } from 'react';
import type { Student, GenerationParams, AnalysisSummary, StudentWithCgpa } from '@/lib/types';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { MergeSidebar } from '@/components/app/merge-sidebar';
import { AnalysisEngine } from '@/lib/engine/analysis-engine';
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

    let allStudents: Student[] = [];
    let firstFileParams: GenerationParams | null = null;

    if (files.length === 1) {
        const file = files[0];
        const content = await file.text();
        try {
            const data = JSON.parse(content);
            if (data.students && data.summary && data.params && data.insights) {
                setParams(data.params);
                setSummary(data.summary);
                setMergedStudents(data.students);
                setInsights(data.insights);
                toast({
                  title: "File Loaded",
                  description: `Loaded ${data.students.length} students from ${file.name}.`,
                });
                return;
            }
        } catch (error) {
            console.error("Error parsing file:", file.name, error);
            toast({
                variant: "destructive",
                title: "File Parse Error",
                description: `Error parsing ${file.name}. Please ensure it is a valid JSON file.`,
            });
            return;
        }
    }


    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const content = await file.text();
      try {
        const data = JSON.parse(content);
        const students = data.students || (Array.isArray(data) ? data : []);
        allStudents = [...allStudents, ...students];

        if (i === 0 && data.params) {
          firstFileParams = data.params;
        }
      } catch (error) {
        console.error("Error parsing file:", file.name, error);
        toast({
            variant: "destructive",
            title: "File Parse Error",
            description: `Error parsing ${file.name}. Please ensure it's a valid JSON file from this application.`,
        });
        return;
      }
    }

    if (allStudents.length === 0) {
        toast({
            variant: "destructive",
            title: "No Students Found",
            description: "No student data found in the selected files.",
        });
        return;
    }

    let analysisParams: GenerationParams;
    if (firstFileParams) {
      analysisParams = firstFileParams;
    } else {
      // Create default params if none are found in the first file
      analysisParams = {
        numStudents: allStudents.length,
        highPerformanceChance: 0.2,
        lowPerformanceChance: 0.2,
        exceptionPercentage: 0.1,
        preGradScoreInfluence: 0.5,
        attendanceImpact: 0.2,
        stdCredit: 15,
        maxCredit: 22,
        minCredit: 12,
        creditsPerSubject: 3,
        maxCreditImpact: 0.5
      };
    }

    setParams(analysisParams);

    const engine = new AnalysisEngine(allStudents, analysisParams);
    const { data: studentsWithCgpa, summary, insights: newInsights } = engine.run();

    setMergedStudents(studentsWithCgpa);
    setSummary(summary);
    setInsights(newInsights);

    toast({
        title: "Merge Successful",
        description: `Successfully merged ${files.length} files with a total of ${studentsWithCgpa.length} students.`,
    });
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
    if (mergedStudents.length === 0 || !params) {
      toast({
        variant: "destructive",
        title: "No data to trim",
        description: "Please merge a dataset first.",
      });
      return;
    }

    const engine = new AnalysisEngine(mergedStudents, params);
    const trimmedStudents = engine.trimData(minCgpa, maxCgpa, percentage);

    if(trimmedStudents.length === mergedStudents.length){
        toast({
            title: "No Students Trimmed",
            description: "No students met the criteria for trimming.",
        });
        return;
    }
    
    const newEngine = new AnalysisEngine(trimmedStudents, params);
    const { data, summary: newSummary, insights: newInsights } = newEngine.run();

    setMergedStudents(data);
    setSummary(newSummary);
    setInsights(newInsights);

    toast({
      title: "Data Trimmed",
      description: `Removed ${mergedStudents.length - data.length} students.`
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
