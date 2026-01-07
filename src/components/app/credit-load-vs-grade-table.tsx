'use client';

import { useMemo } from 'react';
import type { StudentWithCgpa, Grade, GenerationParams } from '@/lib/types';
import { GRADE_SCALE } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CreditLoadVsGradeTableProps {
  students: StudentWithCgpa[];
  params: GenerationParams;
}

export function CreditLoadVsGradeTable({ students, params }: CreditLoadVsGradeTableProps) {
  const data = useMemo(() => {
    if (!students.length || !params) return [];

    const creditLoadData: { [key: number]: { totalImpactedGpa: number; semesterCount: number } } = {};

    students.forEach(student => {
      Object.values(student.semesters).forEach(semester => {
        let semesterTotalGradePoints = 0;
        let subjectCount = 0;

        Object.entries(semester).forEach(([key, value]) => {
          if (key !== 'creditHours' && key !== 'attendancePercentage') {
            semesterTotalGradePoints += (GRADE_SCALE[value as Grade] || 0);
            subjectCount++;
          }
        });

        if (subjectCount > 0) {
            const semesterGpa = semesterTotalGradePoints / subjectCount;
            const creditLoad = semester.creditHours;

            let impactedGpa = semesterGpa;
            if (creditLoad > params.stdCredit) {
                const deviation = (creditLoad - params.stdCredit) / (params.maxCredit - params.stdCredit);
                const impact = -Math.pow(deviation, 1.5) * params.maxCreditImpact / 2.0;
                impactedGpa = semesterGpa + impact;
            }

            if (!creditLoadData[creditLoad]) {
                creditLoadData[creditLoad] = { totalImpactedGpa: 0, semesterCount: 0 };
            }
            creditLoadData[creditLoad].totalImpactedGpa += impactedGpa;
            creditLoadData[creditLoad].semesterCount++;
        }
      });
    });

    return Object.entries(creditLoadData).map(([creditLoad, { totalImpactedGpa, semesterCount }]) => ({
      creditLoad: parseInt(creditLoad),
      avgGpa: totalImpactedGpa / semesterCount,
    })).sort((a, b) => a.creditLoad - b.creditLoad);

  }, [students, params]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Load vs. Grade (Debug)</CardTitle>
        <CardDescription>
          Debug table for credit load vs. average semester grade data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Credit Load</TableHead>
              <TableHead>Average Impacted GPA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(({ creditLoad, avgGpa }) => (
              <TableRow key={creditLoad}>
                <TableCell>{creditLoad}</TableCell>
                <TableCell>{avgGpa.toFixed(4)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
