
'use client';

import { useState } from 'react';
import { Bar, BarChart, Pie, PieChart as RechartsPieChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { AnalysisSummary, StudentWithCgpa } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  value: {
    label: "Students",
  },
} satisfies ChartConfig;

export default function TrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [minCgpa, setMinCgpa] = useState<number>(2.5);
  const [maxCgpa, setMaxCgpa] = useState<number>(3.5);
  const [percentage, setPercentage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<{ summary: AnalysisSummary; insights: string[], downloadFilename?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setAnalysis(null);
      setError(null);
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
        }),
      });

      const trimResult = await trimResponse.json();

      if (!trimResult.success) {
        throw new Error(trimResult.error || 'Trimming process failed.');
      }
      
      setAnalysis(trimResult);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Dataset Trimming Tool</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Upload a student dataset, specify trimming parameters, and get a new analysis.
        </p>
      </header>

      <Card className="mb-8 max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>1. Upload & Configure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid w-full max-w-sm items-center gap-2">
            <Label htmlFor="dataset-file">Upload JSON Dataset</Label>
            <Input id="dataset-file" type="file" accept=".json" onChange={handleFileChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-cgpa">Min CGPA</Label>
              <Input id="min-cgpa" type="number" value={minCgpa} onChange={(e) => setMinCgpa(parseFloat(e.target.value))} step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-cgpa">Max CGPA</Label>
              <Input id="max-cgpa" type="number" value={maxCgpa} onChange={(e) => setMaxCgpa(parseFloat(e.target.value))} step="0.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentage to Remove</Label>
              <Input id="percentage" type="number" value={percentage} onChange={(e) => setPercentage(parseFloat(e.target.value))} step="1" />
            </div>
          </div>

          <Button onClick={handleTrim} disabled={isLoading || !file} className="w-full">
            {isLoading ? 'Processing...' : 'Trim & Analyze'}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="bg-destructive text-destructive-foreground max-w-2xl mx-auto mb-8">
            <CardHeader><CardTitle>Error</CardTitle></CardHeader>
            <CardContent><p>{error}</p></CardContent>
        </Card>
      )}

      {analysis && (
        <div>
            <Card className="mb-8 max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Analysis Results</span>
                        {analysis.downloadFilename && (
                            <a href={`/api/download?filename=${analysis.downloadFilename}`} download>
                                <Button variant="outline">Download Trimmed Data</Button>
                            </a>
                        )}
                    </CardTitle>
                </CardHeader>
            </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle>Total Students</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{analysis.summary.total_students || 0}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Average CGPA</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{(analysis.summary.avg_cgpa || 0).toFixed(2)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Average Attendance</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-bold">{((analysis.summary.avg_attendance || 0) * 100).toFixed(1)}%</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader><CardTitle>Performance Distribution</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square w-full">
                    <RechartsPieChart>
                        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={analysis.summary.performance_distribution} dataKey="value" nameKey="name" innerRadius={60} />
                        <Legend />
                    </RechartsPieChart>
                </ChartContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Department Distribution</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="w-full h-[300px]">
                    <BarChart accessibilityLayer data={analysis.summary.department_distribution} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="name" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                    </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Key Insights</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(analysis.insights || []).map((insight, index) => (
                <p key={index} className="text-sm p-2 bg-muted rounded-md">{insight}</p>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
