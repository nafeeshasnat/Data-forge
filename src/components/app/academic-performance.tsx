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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface AcademicPerformanceProps {
  students: StudentWithCgpa[];
  summary: AnalysisSummary;
  params: GenerationParams | null;
  insights: string[];
  isMergePage?: boolean;
}

function StatsGrid({ summary, students }: { summary: AnalysisSummary, students: StudentWithCgpa[] }) {
    const totalCreditsRequired = students.length > 0 ? students[0].total_credits_required : 130;
    const avgCgpa = summary.avgCgpa != null ? summary.avgCgpa.toFixed(2) : 'N/A';
    const avgAttendance = summary.average_attendance ? `${summary.average_attendance.toFixed(2)}%` : 'N/A';

    return (
        <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="w-4 h-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Total credits required to complete the degree.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalCreditsRequired}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Avg. CGPA</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{avgCgpa}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{avgAttendance}</div>
                </CardContent>
            </Card>
        </div>
    );
}

export function AcademicPerformance({ students, summary, params, insights, isMergePage = false }: AcademicPerformanceProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
            <StatsGrid summary={summary} students={students} />
        </div>
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
            <HscVsCgpaDensityChart summary={summary} />
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
