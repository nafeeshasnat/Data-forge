
'use client';

import { useState } from 'react';
import { Bar, BarChart, Pie, PieChart as RechartsPieChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { AnalysisSummary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/app/logo";
import { Link, useLocation } from "react-router-dom";
import { BotMessageSquare, GitMerge, Scissors, User } from "lucide-react";
import { ThreeValueSlider } from "@/components/ui/three-value-slider";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import "@/components/app/slider-styles.css";
import { StudentDatasetSchema } from "@/lib/schemas";

const chartConfig = {
  value: {
    label: "Students",
  },
} satisfies ChartConfig;

export default function TrimPage() {
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [minCgpa, setMinCgpa] = useState<number>(2.5);
  const [maxCgpa, setMaxCgpa] = useState<number>(3.5);
  const [percentage, setPercentage] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<{ summary: AnalysisSummary; insights: string[], downloadFilename?: string } | null>(null);
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
      const result = StudentDatasetSchema.safeParse(parsed);
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
          {analysis?.downloadFilename && (
            <Card>
              <CardHeader>
                <CardTitle>Download Trimmed Data</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <a href={`/api/download?filename=${analysis.downloadFilename}`} download>
                    Download JSON
                  </a>
                </Button>
              </CardContent>
            </Card>
          )}
        </SidebarContent>
      </Sidebar>
      <SidebarInset className="min-h-screen md:ml-96">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold">Trim & Analyze</h1>
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
          {error && (
            <Card className="bg-destructive text-destructive-foreground">
              <CardHeader><CardTitle>Error</CardTitle></CardHeader>
              <CardContent><p>{error}</p></CardContent>
            </Card>
          )}

          {analysis ? (
            <>
              <Card>
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

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </>
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
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
