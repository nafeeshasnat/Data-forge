'use client';

import type { StudentWithCgpa, AnalysisSummary, GenerationParams } from '@/lib/types';
import { CgpaDistributionChart } from './charts/cgpa-distribution-chart';
import { DepartmentDistributionChart } from './charts/department-distribution-chart';
import { HscVsCgpaChart } from './charts/hsc-vs-cgpa-chart';
import { PerformanceDistributionChart } from './charts/performance-distribution-chart';
import { CreditLoadVsGradeChart } from './charts/credit-load-vs-grade-chart';
import { AttendanceVsGradeChart } from './charts/attendance-vs-grade-chart';
import { SemesterCountChart } from './charts/semester-count-chart';
import { CreditDistributionChart } from './charts/credit-distribution-chart';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnalysisInsights } from './analysis-insights';

interface AcademicPerformanceProps {
  students: StudentWithCgpa[];
  summary: AnalysisSummary;
  params: GenerationParams;
  insights: string[];
}

export function AcademicPerformance({ students, summary, params, insights }: AcademicPerformanceProps) {

  const handleDownloadLog = (title: string, data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_log.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
            <AnalysisInsights insights={insights} />
        </div>
      <Card>
        <CardHeader>
          <CardTitle>CGPA Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <CgpaDistributionChart students={students} params={params} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('CGPA Distribution', { params, students })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentDistributionChart summary={summary} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('Department Distribution', { summary })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HSC vs CGPA</CardTitle>
        </CardHeader>
        <CardContent>
          <HscVsCgpaChart students={students} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('HSC vs CGPA', { students })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceDistributionChart summary={summary} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('Performance Distribution', { summary })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Load vs Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <CreditLoadVsGradeChart students={students} params={params} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('Credit Load vs Grade', { params, students })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance vs Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceVsGradeChart students={students} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('Attendance vs Grade', { students })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semester Count</CardTitle>
        </CardHeader>
        <CardContent>
          <SemesterCountChart students={students} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('Semester Count', { students })}>Download Log</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <CreditDistributionChart students={students} />
        </CardContent>
        <CardFooter>
          <Button onClick={() => handleDownloadLog('Credit Distribution', { students })}>Download Log</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
