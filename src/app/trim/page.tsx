
'use client';

import { useState } from 'react';
 
import type { AnalysisSummary, GenerationParams } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "react-router-dom";
import { Scissors } from "lucide-react";
import { ThreeValueSlider } from "@/components/ui/three-value-slider";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "@/components/app/slider-styles.css";
import { StudentDatasetContainerSchema } from "@/lib/schemas";
import { AcademicPerformance } from "@/components/app/academic-performance";
import { performanceThresholds } from "@/lib/config";
import { AppShell } from "@/components/app/app-shell";

export default function TrimPage() {
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [minCgpa, setMinCgpa] = useState<number>(2.5);
  const [maxCgpa, setMaxCgpa] = useState<number>(3.5);
  const [percentage, setPercentage] = useState<number>(10);
  const [analysisThresholds, setAnalysisThresholds] = useState({
    high: performanceThresholds.high,
    mid: performanceThresholds.mid,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<{
    summary: AnalysisSummary;
    insights: string[];
    downloadFilename?: string;
    params?: GenerationParams;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    try {
      const text = await selectedFile.text();
      const parsed = JSON.parse(text);
      const result = StudentDatasetContainerSchema.safeParse(parsed);
      if (!result.success) {
        setFile(null);
        setAnalysis(null);
        setError("Invalid dataset schema. Please upload a valid student dataset.");
        return;
      }
    } catch (error) {
      setFile(null);
      setAnalysis(null);
      setError("Failed to read the file. Please upload valid JSON.");
      return;
    }

    setFile(selectedFile);
    setAnalysis(null);
    setError(null);
    await handleAnalyze(selectedFile);
  };

  const toCamelCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((value) => toCamelCase(value));
    }
    if (obj !== null && obj.constructor === Object) {
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

  const handleAnalyze = async (fileOverride?: File) => {
    const activeFile = fileOverride ?? file;
    if (!activeFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', activeFile);

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'File upload failed.');
      }

      const trimResponse = await fetch('/api/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadResult.filename,
          minCgpa: 0,
          maxCgpa: 4.0,
          percentage: 0,
          perfHigh: analysisThresholds.high,
          perfMid: analysisThresholds.mid,
        }),
      });

      const trimResult = await trimResponse.json();

      if (!trimResult.success) {
        throw new Error(trimResult.error || 'Analysis process failed.');
      }
      
      const camelCaseResult = toCamelCase(trimResult);
      setAnalysis(camelCaseResult);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrim = async () => {
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadResult = await uploadResponse.json();

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'File upload failed.');
      }

      const trimResponse = await fetch('/api/trim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadResult.filename,
          minCgpa,
          maxCgpa,
          percentage,
          perfHigh: analysisThresholds.high,
          perfMid: analysisThresholds.mid,
        }),
      });

      const trimResult = await trimResponse.json();

      if (!trimResult.success) {
        throw new Error(trimResult.error || 'Trimming process failed.');
      }

      const camelCaseResult = toCamelCase(trimResult);
      setAnalysis(camelCaseResult);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTrimmedData = async () => {
    if (!analysis?.downloadFilename) {
      setError('No trimmed dataset available for download.');
      return;
    }

    try {
      const response = await fetch(`/api/download/${encodeURIComponent(analysis.downloadFilename)}`);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}.`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Download failed. Server returned an HTML error page.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = analysis.downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download trimmed dataset.');
    }
  };

  const updateThreshold = (key: "high" | "mid", value: string) => {
    const numericValue = Number(value);
    setAnalysisThresholds((prev) => ({
      ...prev,
      [key]: Number.isFinite(numericValue) ? numericValue : prev[key],
    }));
  };

  return (
    <AppShell
      title="Trim & Analyze"
      icon={<Scissors className="h-4 w-4 text-primary" />}
      pathname={location.pathname}
      sidebar={(
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trim Dataset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="dataset-file">Upload JSON Dataset</Label>
                <Input id="dataset-file" type="file" accept=".json" onChange={handleFileChange} />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>CGPA Range: {minCgpa.toFixed(1)} - {maxCgpa.toFixed(1)}</Label>
                  <ThreeValueSlider
                    min={0}
                    max={4}
                    step={0.1}
                    value={[minCgpa, maxCgpa]}
                    onValueChange={(value) => {
                      if (Array.isArray(value)) {
                        setMinCgpa(value[0]);
                        setMaxCgpa(value[1]);
                      }
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Percentage to Remove: {percentage.toFixed(0)}%</Label>
                  <div className="slider-container">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={percentage}
                      onChange={(value) => {
                        if (typeof value === "number") {
                          setPercentage(value);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleTrim} disabled={isLoading || !file} className="w-full">
                {isLoading ? 'Processing...' : 'Trim & Analyze'}
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Analysis Performance Groups</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="trim-analysis-high">High Threshold</Label>
                <Input
                  id="trim-analysis-high"
                  type="number"
                  step="0.05"
                  value={analysisThresholds.high.toFixed(2)}
                  onChange={(event) => updateThreshold("high", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trim-analysis-mid">Mid Threshold</Label>
                <Input
                  id="trim-analysis-mid"
                  type="number"
                  step="0.05"
                  value={analysisThresholds.mid.toFixed(2)}
                  onChange={(event) => updateThreshold("mid", event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
          {analysis?.downloadFilename && (
            <Card>
              <CardHeader>
                <CardTitle>Download Trimmed Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={handleDownloadTrimmedData}>
                  Download JSON
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    >
      {error && (
        <Card className="bg-destructive text-destructive-foreground">
          <CardHeader><CardTitle>Error</CardTitle></CardHeader>
          <CardContent><p>{error}</p></CardContent>
        </Card>
      )}

      {analysis ? (
        <AcademicPerformance
          students={[]}
          summary={analysis.summary}
          params={analysis.params ?? null}
          insights={analysis.insights || []}
          isMergePage={true}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Trim a Dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload a JSON dataset in the sidebar, choose your CGPA range, and run the trim to see the updated analysis here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
