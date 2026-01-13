
'use client';

import * as React from 'react';
import { generateSyntheticData } from '@/lib/data-generator';
import { AnalysisEngine } from '@/lib/engine/analysis-engine';
import type { GenerationParams, Student, StudentWithCgpa, AnalysisSummary } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ParameterSidebar } from '@/components/app/parameter-sidebar';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { BotMessageSquare, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'react-router-dom';
import { AppShell } from '@/components/app/app-shell';

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

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  return `{${keys.map((key) => `"${key}":${stableStringify(record[key])}`).join(",")}}`;
};

const hashString = (value: string): string => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
};

const downloadBlob = (data: string, filename: string) => {
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const pearsonCorrelation = (xs: number[], ys: number[]): number | null => {
  if (xs.length !== ys.length || xs.length < 2) return null;
  const n = xs.length;
  const meanX = xs.reduce((sum, x) => sum + x, 0) / n;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / n;
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? null : num / denom;
};

const computeCgpaStats = (cgpas: number[]) => {
  if (cgpas.length === 0) {
    return { mean: null, stddev: null, skewness: null, shape: "insufficient-data" as const };
  }
  const n = cgpas.length;
  const mean = cgpas.reduce((sum, value) => sum + value, 0) / n;
  const variance = cgpas.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / n;
  const stddev = Math.sqrt(variance);
  const skewness = stddev === 0
    ? 0
    : cgpas.reduce((sum, value) => sum + Math.pow(value - mean, 3), 0) / (n * Math.pow(stddev, 3));
  const shape = skewness < -0.5 ? "left-skewed" : skewness > 0.5 ? "right-skewed" : "normal-ish";
  return { mean, stddev, skewness, shape };
};

const buildGenerationReport = (data: StudentWithCgpa[], params: GenerationParams | null) => {
  const attendance: number[] = [];
  const cgpas: number[] = [];
  const overloads: number[] = [];
  const preGrads: number[] = [];
  const semesterGpaByIndex: Record<number, number[]> = {};

  data.forEach((student) => {
    const avgAttendance = student.avgAttendance ?? null;
    const avgCreditLoad = student.avgCreditLoad ?? null;
    if (avgAttendance != null) attendance.push(avgAttendance);
    if (avgCreditLoad != null) overloads.push(avgCreditLoad - (params?.stdCredit ?? 0));
    cgpas.push(student.cgpa);

    const preGrad = ((student.ssc_gpa / 5) + (student.hsc_gpa / 5)) / 2 * 4;
    preGrads.push(preGrad);

    if (student.semesterDetails && student.semesterDetails.length > 0) {
      student.semesterDetails.forEach((semester, index) => {
        if (!semesterGpaByIndex[index]) semesterGpaByIndex[index] = [];
        semesterGpaByIndex[index].push(semester.gpa);
      });
    }
  });

  const attendanceCgpa = pearsonCorrelation(attendance, cgpas);
  const creditOverloadCgpa = pearsonCorrelation(overloads, cgpas);

  const maxSemesters = Math.min(3, Object.keys(semesterGpaByIndex).length);
  const preGradVsSemesterGpa = Array.from({ length: maxSemesters }).map((_, idx) => {
    const semesterGpas = semesterGpaByIndex[idx] ?? [];
    const correlation = pearsonCorrelation(preGrads.slice(0, semesterGpas.length), semesterGpas);
    return { semesterIndex: idx + 1, correlation };
  });

  const correlationsForSlope = preGradVsSemesterGpa
    .map((entry, index) => ({ x: index + 1, y: entry.correlation }))
    .filter((entry): entry is { x: number; y: number } => entry.y !== null);

  const preGradDecaySlope = correlationsForSlope.length >= 2
    ? (() => {
        const xs = correlationsForSlope.map((entry) => entry.x);
        const ys = correlationsForSlope.map((entry) => entry.y);
        const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
        const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;
        let num = 0;
        let denom = 0;
        for (let i = 0; i < xs.length; i += 1) {
          const dx = xs[i] - meanX;
          num += dx * (ys[i] - meanY);
          denom += dx * dx;
        }
        return denom === 0 ? null : num / denom;
      })()
    : null;

  const cgpaStats = computeCgpaStats(cgpas);
  const riskClassBalance = data.reduce<Record<string, number>>((acc, student) => {
    const group = student.performanceGroup ?? "Unknown";
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {});

  const riskClassItems = Object.entries(riskClassBalance).map(([group, count]) => ({
    group,
    count,
    percentage: data.length > 0 ? Number(((count / data.length) * 100).toFixed(2)) : 0,
  }));

  return {
    correlations: {
      attendanceCgpa,
      creditOverloadCgpa,
      preGradVsSemesterGpa,
      preGradDecaySlope,
    },
    distributions: {
      cgpa: cgpaStats,
      riskClassBalance: riskClassItems,
    },
  };
};

export function MainPage() {
  const location = useLocation();
  const [students, setStudents] = React.useState<StudentWithCgpa[]>([]);
  const [summary, setSummary] = React.useState<AnalysisSummary | null>(null);
  const [insights, setInsights] = React.useState<string[]>([]);
  const [params, setParams] = React.useState<GenerationParams | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [report, setReport] = React.useState<ReturnType<typeof buildGenerationReport> | null>(null);
  const [trimHistory, setTrimHistory] = React.useState<Array<{
    minCgpa: number;
    maxCgpa: number;
    percentage: number;
    removed: number;
    remaining: number;
  }>>([]);
  const { toast } = useToast();

  const handleGenerate = React.useCallback(async (params: GenerationParams) => {
    setIsLoading(true);
    setParams(params);
    setTrimHistory([]);
    try {
      const generatedStudents = generateSyntheticData(params);
      const engine = new AnalysisEngine(generatedStudents, params);
      const { data, summary, insights } = engine.run();

      setStudents(data);
      setSummary(summary);
      setInsights(insights);
      setReport(buildGenerationReport(data, params));

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
    setReport(buildGenerationReport(data, params));
    setTrimHistory(prev => ([
      ...prev,
      {
        minCgpa,
        maxCgpa,
        percentage,
        removed: students.length - data.length,
        remaining: data.length,
      },
    ]));

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

    const payload = {
      meta: {
        seed: params?.seed ?? null,
        generatedAt: new Date().toISOString(),
        params,
        trimHistory,
        report,
      },
      students: cleanStudents,
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const seedLabel = typeof params?.seed === "string"
      ? params.seed.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 24)
      : params?.seed !== undefined && params?.seed !== null
        ? String(params.seed)
        : String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    const datasetFilename = `generated_${cleanStudents.length}_students_${seedLabel}.json`;
    downloadBlob(dataStr, datasetFilename);

    const gradeScaleHash = params?.gradeScale
      ? hashString(stableStringify(params.gradeScale))
      : "unknown";
    const metadataPayload = {
      generatorVersion: {
        gitCommit: import.meta.env.VITE_GIT_COMMIT ?? "unknown",
        appVersion: import.meta.env.VITE_APP_VERSION ?? "dev",
      },
      timestamp: new Date().toISOString(),
      params,
      seed: params?.seed ?? null,
      gradeScaleHash,
      datasetSize: cleanStudents.length,
      datasetFilename,
    };
    const metadataFilename = datasetFilename.replace(/\.json$/, ".metadata.json");
    downloadBlob(JSON.stringify(metadataPayload, null, 2), metadataFilename);
  };

  return (
    <AppShell
      title="Generate Dataset"
      icon={<BotMessageSquare className="h-4 w-4 text-primary" />}
      pathname={location.pathname}
      sidebar={(
        <div className="space-y-4">
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
        </div>
      )}
    >
      {students.length > 0 && summary && params ? (
        <AcademicPerformance students={students} summary={summary} params={params} insights={insights} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2 text-2xl">
                <BotMessageSquare className="h-8 w-8 text-primary" /> Welcome to DataForge
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
    </AppShell>
  );
}
