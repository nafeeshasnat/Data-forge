'use client';

import { useState } from 'react';
import type { Student, GenerationParams, AnalysisSummary, StudentWithCgpa } from '@/lib/types';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { MergeSidebar } from '@/components/app/merge-sidebar';
import { AnalysisEngine } from '@/lib/engine/analysis-engine';

export default function MergePage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [mergedStudents, setMergedStudents] = useState<StudentWithCgpa[]>([]);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [params, setParams] = useState<GenerationParams | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
  };

  const handleMerge = async () => {
    if (!files || files.length === 0) {
      alert('Please select files to merge.');
      return;
    }

    if (files.length === 1) {
      const file = files[0];
      const content = await file.text();
      try {
        const data = JSON.parse(content);
        if (data.students && data.summary && data.params) {
          setParams(data.params);
          setSummary(data.summary);
          setMergedStudents(data.students);
          return;
        }
      } catch (error) {
        console.error("Error parsing file:", file.name, error);
        alert(`Error parsing file: ${file.name}. Please ensure it is a valid JSON file.`);
        return;
      }
    }

    let allStudents: Student[] = [];
    let firstFileParams: GenerationParams | null = null;

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
        alert(`Error parsing file: ${file.name}. Please ensure it is a valid JSON file.`);
        return;
      }
    }

    if (allStudents.length === 0) {
        alert("No students found in the selected files.");
        return;
    }

    let analysisParams: GenerationParams;
    if (firstFileParams) {
      analysisParams = firstFileParams;
    } else {
      analysisParams = { numStudents: allStudents.length, highPerformanceChance: 0.2, lowPerformanceChance: 0.2, exceptionPercentage: 0.1, preGradScoreInfluence: 0.5, attendanceImpact: 0.2, stdCredit: 15, maxCredit: 22, minCredit: 12, creditsPerSubject: 3, maxCreditImpact: 0.5 };
    }

    setParams(analysisParams);

    const engine = new AnalysisEngine(allStudents, analysisParams);
    const { data: studentsWithCgpa, summary } = engine.run();

    setMergedStudents(studentsWithCgpa);
    setSummary(summary);
  };

  const handleDownload = () => {
    if (mergedStudents.length === 0) {
      alert('No merged data to download.');
      return;
    }

    const dataToDownload = {
      params: params,
      summary: summary,
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
  };

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-80 h-full overflow-y-auto border-r">
        <MergeSidebar 
            onMerge={handleMerge} 
            onDownload={handleDownload} 
            onFileChange={handleFileChange} 
            mergedStudentsCount={mergedStudents.length} 
        />
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-4">
            <h1 className="text-2xl font-bold">Merge and Analyze Datasets</h1>
        </div>
        {mergedStudents.length > 0 && summary && params ? (
            <AcademicPerformance students={mergedStudents} summary={summary} params={params} />
        ) : (
            <div className="flex items-center justify-center h-full text-center p-8 border rounded-lg bg-card">
                <p className="text-muted-foreground">Please upload and merge datasets to see the analytics.</p>
            </div>
        )}
      </main>
    </div>
  );
}
