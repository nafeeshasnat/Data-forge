'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart3, Loader2 } from 'lucide-react';
import type { AnalysisSummary, GenerationParams } from '@/lib/types';
import { performanceThresholds } from '@/lib/config';
import { AcademicPerformance } from '@/components/app/academic-performance';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts';
import { AppShell } from '@/components/app/app-shell';

type SingleStudentAnalysis = {
  gpaTrend: Array<{ name: string; gpa: number }>;
  creditLoad: Array<{ semester: number; credits: number; gpa: number }>;
  attendanceTrend: Array<{ name: string; attendance: number; gradeChangeRate: number }>;
};

type StudentInfo = {
  studentId: number | null;
  department: string | null;
  gender: string | null;
  birthYear: number | null;
};

type DatasetSource = {
  file?: string;
  meta?: Record<string, unknown>;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const getKeyTextSize = (depth: number) => {
  if (depth <= 2) return 'text-base';
  if (depth === 3) return 'text-sm';
  return 'text-xs';
};

const getValueTextSize = (depth: number) => {
  if (depth <= 2) return 'text-base';
  if (depth === 3) return 'text-sm';
  return 'text-xs';
};

const getIndentStyle = (depth: number) => ({
  paddingLeft: `${Math.max(0, depth - 1) * 12}px`,
});

const renderInlineValue = (value: unknown, path: string): ReactNode => {
  const depth = path.split('.').length;
  const keyTextSize = getKeyTextSize(depth);
  const valueTextSize = getValueTextSize(depth);

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <div className={`${valueTextSize} text-muted-foreground`}>No details available.</div>;
    }
    return (
      <div className="grid gap-2">
        {entries.map(([key, child]) => (
          <div key={`${path}.${key}`} className="flex flex-wrap items-start gap-2 border-b border-dashed border-muted pb-2 last:border-b-0 last:pb-0">
            <span className={`${keyTextSize} font-medium text-foreground`}>{key}:</span>
            <div className={`min-w-0 ${valueTextSize} text-muted-foreground`}>
              {renderInlineValue(child, `${path}.${key}`)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div className={`${valueTextSize} text-muted-foreground`}>No entries available.</div>;
    }
    const allPrimitive = value.every(
      (entry) => entry === null || ['string', 'number', 'boolean'].includes(typeof entry)
    );
    if (allPrimitive) {
      return (
        <ul className={`grid gap-1 ${valueTextSize} text-muted-foreground`}>
          {value.map((entry, index) => (
            <li key={`${path}.${index}`} className="break-words">
              {entry === null ? 'null' : String(entry)}
            </li>
          ))}
        </ul>
      );
    }
    return (
      <div className="grid gap-2">
        {value.map((entry, index) => (
          <div key={`${path}.${index}`} className="flex flex-wrap items-start gap-2 border-b border-dashed border-muted pb-2 last:border-b-0 last:pb-0">
            <span className={`${keyTextSize} font-medium text-foreground`}>{`Item ${index + 1}`}:</span>
            <div className={`min-w-0 ${valueTextSize} text-muted-foreground`}>
              {renderInlineValue(entry, `${path}.${index}`)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className="break-words">
      {value === null ? 'null' : String(value)}
    </span>
  );
};

const renderMetaValue = (value: unknown, path: string): ReactNode => {
  const depth = path.split('.').length;
  const keyTextSize = getKeyTextSize(depth);
  const valueTextSize = getValueTextSize(depth);
  const isPrimitive = (val: unknown) => (
    val === null || ['string', 'number', 'boolean'].includes(typeof val)
  );

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <div className={`${valueTextSize} text-muted-foreground`}>No details available.</div>;
    }
    if (entries.length === 1) {
      const [key, child] = entries[0];
      const childIsPrimitive = isPrimitive(child);
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <span className={`${keyTextSize} font-medium text-foreground`}>{key}:</span>
            {childIsPrimitive && (
              <div className={`min-w-0 ${valueTextSize} text-muted-foreground`}>
                {renderInlineValue(child, `${path}.${key}`)}
              </div>
            )}
          </div>
          {!childIsPrimitive && (
            <div className="border-l border-dashed border-muted pl-3" style={getIndentStyle(depth + 1)}>
              {renderMetaValue(child, `${path}.${key}`)}
            </div>
          )}
        </div>
      );
    }
    const primitiveEntries = entries.filter(([, value]) => isPrimitive(value));
    const nestedEntries = entries.filter(([, value]) => !isPrimitive(value));

    return (
      <div className="space-y-3">
        {primitiveEntries.length > 0 && (
          <div className="grid gap-2">
            {primitiveEntries.map(([key, child]) => {
              const itemKey = `${path}.${key}`;
              return (
                <div key={itemKey} className="flex flex-wrap items-start gap-2 border-b border-dashed border-muted pb-2 last:border-b-0 last:pb-0">
                  <span className={`${keyTextSize} font-medium text-foreground`}>{key}:</span>
                  <div className={`min-w-0 ${valueTextSize} text-muted-foreground`}>
                    {renderInlineValue(child, itemKey)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {nestedEntries.length > 0 && (
          <Accordion type="multiple" className="w-full">
            {nestedEntries.map(([key, child]) => {
              const itemKey = `${path}.${key}`;
              return (
                <AccordionItem value={itemKey} key={itemKey}>
                  <AccordionTrigger className={keyTextSize}>{key}</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="border-l border-dashed border-muted pl-3" style={getIndentStyle(depth + 1)}>
                      {renderMetaValue(child, itemKey)}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <div className={`${valueTextSize} text-muted-foreground`}>No entries available.</div>;
    }
    if (value.length === 1) {
      const child = value[0];
      const childIsPrimitive = isPrimitive(child);
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <span className={`${keyTextSize} font-medium text-foreground`}>Item 1:</span>
            {childIsPrimitive && (
              <div className={`min-w-0 ${valueTextSize} text-muted-foreground`}>
                {renderInlineValue(child, `${path}.0`)}
              </div>
            )}
          </div>
          {!childIsPrimitive && (
            <div className="border-l border-dashed border-muted pl-3" style={getIndentStyle(depth + 1)}>
              {renderMetaValue(child, `${path}.0`)}
            </div>
          )}
        </div>
      );
    }
    const primitiveEntries = value
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => isPrimitive(entry));
    const nestedEntries = value
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => !isPrimitive(entry));

    if (nestedEntries.length === 0) {
      return (
        <ul className={`grid gap-1 ${valueTextSize} text-muted-foreground`}>
          {primitiveEntries.map(({ entry, index }) => (
            <li key={`${path}.${index}`} className="break-words">
              {entry === null ? 'null' : String(entry)}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="space-y-3">
        {primitiveEntries.length > 0 && (
          <ul className={`grid gap-1 ${valueTextSize} text-muted-foreground`}>
            {primitiveEntries.map(({ entry, index }) => (
              <li key={`${path}.${index}`} className="break-words">
                {entry === null ? 'null' : String(entry)}
              </li>
            ))}
          </ul>
        )}
        <Accordion type="multiple" className="w-full">
          {nestedEntries.map(({ entry, index }) => {
            const itemKey = `${path}.${index}`;
            return (
              <AccordionItem value={itemKey} key={itemKey}>
                <AccordionTrigger className={keyTextSize}>{`Item ${index + 1}`}</AccordionTrigger>
                <AccordionContent className="pt-2">
                  <div className="border-l border-dashed border-muted pl-3" style={getIndentStyle(depth + 1)}>
                    {renderMetaValue(entry, itemKey)}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );
  }

  return (
    <div className={`${valueTextSize} font-medium text-foreground break-words`}>
      {value === null ? 'null' : String(value)}
    </div>
  );
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

function SingleStudentCharts({ analysis, student }: { analysis: SingleStudentAnalysis; student: StudentInfo | null }) {
  return (
    <>
      {student && (
        <Card>
          <CardHeader>
            <CardTitle>Student Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm text-muted-foreground">
            <div>Student ID: {student.studentId ?? 'N/A'}</div>
            <div>Department: {student.department ?? 'N/A'}</div>
            <div>Gender: {student.gender ?? 'N/A'}</div>
            <div>Birth Year: {student.birthYear ?? 'N/A'}</div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>GPA Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analysis.gpaTrend}>
                <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Line type="monotone" dataKey="gpa" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Credits vs CGPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                  <XAxis type="number" dataKey="credits" name="Credits" />
                  <YAxis type="number" dataKey="gpa" name="CGPA" domain={[0, 4]} />
                  <Tooltip />
                  <Scatter data={analysis.creditLoad} fill="#dc2626" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Attendance & Grade Change Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analysis.attendanceTrend}>
                  <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" />
                  <YAxis
                    yAxisId="attendance"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <YAxis
                    yAxisId="grade"
                    orientation="right"
                    domain={['dataMin - 50', 'dataMax + 50']}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip />
                  <Line
                    yAxisId="attendance"
                    type="monotone"
                    dataKey="attendance"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    yAxisId="grade"
                    type="monotone"
                    dataKey="gradeChangeRate"
                    stroke="#a78bfa"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default function AnalysisPage() {
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState<'dataset' | 'single' | null>(null);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [params, setParams] = useState<GenerationParams | null>(null);
  const [sources, setSources] = useState<DatasetSource[]>([]);
  const [singleAnalysis, setSingleAnalysis] = useState<SingleStudentAnalysis | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [analysisThresholds, setAnalysisThresholds] = useState({
    high: performanceThresholds.high,
    mid: performanceThresholds.mid,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setAnalysisType(null);
    setSummary(null);
    setInsights([]);
    setParams(null);
    setSources([]);
    setSingleAnalysis(null);
    setStudentInfo(null);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please select a JSON file to analyze.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysisType(null);
    setSummary(null);
    setInsights([]);
    setParams(null);
    setSources([]);
    setSingleAnalysis(null);
    setStudentInfo(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('plotPoints', '80');
    formData.append('perfHigh', analysisThresholds.high.toString());
    formData.append('perfMid', analysisThresholds.mid.toString());

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to analyze file.');
      }

      const result = await response.json();
      const camelCaseResult = toCamelCase(result);

      if (camelCaseResult.datasetType === 'single') {
        setAnalysisType('single');
        setSingleAnalysis(camelCaseResult.analysis || null);
        setStudentInfo(camelCaseResult.student || null);
      } else if (camelCaseResult.datasetType === 'dataset') {
        setAnalysisType('dataset');
        setSummary(camelCaseResult.summary || null);
        setInsights(camelCaseResult.insights || []);
        setParams(camelCaseResult.params || null);
        setSources(camelCaseResult.sources || []);
      } else {
        throw new Error('Unsupported analysis response.');
      }

      toast({
        title: 'Analysis Ready',
        description: 'Your dataset has been analyzed successfully.',
      });
    } catch (err: any) {
      const message = err?.message || 'Failed to analyze file.';
      setError(message);
      toast({
        variant: 'destructive',
        title: 'Analysis failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateThreshold = (key: 'high' | 'mid', value: string) => {
    const numericValue = Number(value);
    setAnalysisThresholds((prev) => ({
      ...prev,
      [key]: Number.isFinite(numericValue) ? numericValue : prev[key],
    }));
  };

  const metadataSources = sources.filter((source) => source.meta && Object.keys(source.meta).length > 0);

  return (
    <AppShell
      title="Analyze Data"
      icon={<BarChart3 className="h-4 w-4 text-primary" />}
      pathname={location.pathname}
      sidebar={(
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid w-full items-center gap-2">
                <Label htmlFor="analysis-file">Upload JSON Dataset</Label>
                <Input id="analysis-file" type="file" accept=".json" onChange={handleFileChange} disabled={isLoading} />
              </div>
              <Button onClick={handleAnalyze} className="w-full" disabled={isLoading || !file}>
                {isLoading ? 'Analyzing...' : 'Run Analysis'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Supports dataset arrays, datasets with metadata, or a single student record.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Analysis Performance Groups</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="analysis-high">High Threshold</Label>
                <Input
                  id="analysis-high"
                  type="number"
                  step="0.05"
                  value={analysisThresholds.high.toFixed(2)}
                  onChange={(event) => updateThreshold('high', event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="analysis-mid">Mid Threshold</Label>
                <Input
                  id="analysis-mid"
                  type="number"
                  step="0.05"
                  value={analysisThresholds.mid.toFixed(2)}
                  onChange={(event) => updateThreshold('mid', event.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    >
      {error && (
        <Card className="bg-destructive text-destructive-foreground">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : analysisType === 'dataset' && summary ? (
        <>
          <AcademicPerformance students={[]} summary={summary} params={params} insights={insights} isMergePage={true} />
          {metadataSources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Generated Dataset Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="multiple" className="w-full">
                  {metadataSources.map((source, index) => {
                    const sourceLabel = source.file ? `Source: ${source.file}` : `Source ${index + 1}`;
                    const sourceKey = `${source.file ?? 'dataset'}-${index}`;
                    return (
                      <AccordionItem key={sourceKey} value={sourceKey}>
                        <AccordionTrigger className="text-sm font-medium">{sourceLabel}</AccordionTrigger>
                        <AccordionContent className="pt-3">
                          <div className="rounded-md border p-4">
                            {renderMetaValue(source.meta ?? {}, `source.${sourceKey}`)}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          )}
        </>
      ) : analysisType === 'single' && singleAnalysis ? (
        <SingleStudentCharts analysis={singleAnalysis} student={studentInfo} />
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Analyze a Dataset</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload a dataset or single student record from the sidebar to review analysis insights here.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
