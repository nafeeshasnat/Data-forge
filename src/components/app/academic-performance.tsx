'use client';

import type { StudentWithCgpa, AnalysisSummary, GenerationParams } from '@/lib/types';
import { CgpaDistributionChart } from './charts/cgpa-distribution-chart';
import { DepartmentDistributionChart } from './charts/department-distribution-chart';
import { HscVsCgpaChart } from './charts/hsc-vs-cgpa-chart';
import { HscVsCgpaDensityChart } from './charts/hsc-vs-cgpa-density-chart';
import { PerformanceDistributionChart } from './charts/performance-distribution-chart';
import { CreditLoadVsGradeChart } from './charts/credit-load-vs-grade-chart';
import { AttendanceVsGradeChart } from './charts/attendance-vs-grade-chart';
import { SemesterCountChart } from './charts/semester-count-chart';
import { CreditDistributionChart } from './charts/credit-distribution-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalysisInsights } from './analysis-insights';

interface AcademicPerformanceProps {
  students: StudentWithCgpa[];
  summary: AnalysisSummary;
  params: GenerationParams;
  insights: string[];
  isMergePage?: boolean;
}

export function AcademicPerformance({ students, summary, params, insights, isMergePage = false }: AcademicPerformanceProps) {
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
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentDistributionChart summary={summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>HSC vs CGPA</CardTitle>
        </CardHeader>
        <CardContent>
          {isMergePage ? (
            <HscVsCgpaDensityChart students={students} />
          ) : (
            <HscVsCgpaChart students={students} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PerformanceDistributionChart summary={summary} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Load vs Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <CreditLoadVsGradeChart students={students} params={params} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance vs Grade</CardTitle>
        </CardHeader>
        <CardContent>
          <AttendanceVsGradeChart students={students} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semester Count</CardTitle>
        </CardHeader>
        <CardContent>
          <SemesterCountChart students={students} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Credit Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <CreditDistributionChart students={students} />
        </CardContent>
      </Card>
    </div>
  );
}
