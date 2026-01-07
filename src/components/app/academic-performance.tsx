"use client"

import type { StudentWithCgpa, AnalysisSummary, GenerationParams } from "@/lib/types"
import { CgpaDistributionChart } from "./charts/cgpa-distribution-chart"
import { DepartmentDistributionChart } from "./charts/department-distribution-chart"
import { HscVsCgpaChart } from "./charts/hsc-vs-cgpa-chart"
import { PerformanceDistributionChart } from "./charts/performance-distribution-chart"
import { CreditLoadVsGradeChart } from "./charts/credit-load-vs-grade-chart"
import { AttendanceVsGradeChart } from "./charts/attendance-vs-grade-chart"
import { SemesterCountChart } from "./charts/semester-count-chart"
import { CreditDistributionChart } from "./charts/credit-distribution-chart"

interface AcademicPerformanceProps {
  students: StudentWithCgpa[]
  summary: AnalysisSummary
  params: GenerationParams
}

export function AcademicPerformance({ students, summary, params }: AcademicPerformanceProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2">
      <CgpaDistributionChart students={students} params={params} />
      <DepartmentDistributionChart summary={summary} />
      <HscVsCgpaChart students={students} />
      <PerformanceDistributionChart summary={summary} />
      <CreditLoadVsGradeChart students={students} params={params} />
      <AttendanceVsGradeChart students={students} />
      <SemesterCountChart students={students} />
      <CreditDistributionChart students={students} />
    </div>
  )
}
