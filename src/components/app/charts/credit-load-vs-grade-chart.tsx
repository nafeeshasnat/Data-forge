'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StudentWithCgpa, GenerationParams, Semester } from '@/lib/types';

interface CreditLoadVsGradeChartProps {
  students: StudentWithCgpa[];
  params: GenerationParams | null;
}

const chartConfig = {
  avgGpa: {
    label: "Average GPA",
    color: "hsl(348, 57.60%, 48.00%)",
  },
} satisfies ChartConfig;

const GRADE_SCALE: Record<string, number> = {
    "A+": 4.00, "A": 3.75, "A-": 3.50,
    "B+": 3.25, "B": 3.00, "B-": 2.75,
    "C+": 2.50, "C": 2.25,
    "D": 2.00, "F": 0.00
};

const calculateGpaFromGrades = (semester: Omit<Semester, 'creditHours' | 'attendancePercentage'>): number => {
    let totalPoints = 0;
    let subjectCount = 0;
    for (const key in semester) {
        const grade = semester[key as keyof typeof semester];
        if (typeof grade === 'string' && GRADE_SCALE[grade] !== undefined) {
            totalPoints += GRADE_SCALE[grade];
            subjectCount++;
        }
    }
    return subjectCount > 0 ? totalPoints / subjectCount : 0;
};

export function CreditLoadVsGradeChart({ students, params }: CreditLoadVsGradeChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const creditBins = new Map<number, { totalGpa: number; count: number }>();

    students.forEach(student => {
      if (student.semesters && typeof student.semesters === 'object') {
        Object.values(student.semesters).forEach((semester: any) => {
            const gpa = calculateGpaFromGrades(semester);
            if (semester && semester.creditHours != null && gpa != null) {
                const creditBin = Math.round(semester.creditHours / 3) * 3;
                if (!creditBins.has(creditBin)) {
                    creditBins.set(creditBin, { totalGpa: 0, count: 0 });
                }
                const bin = creditBins.get(creditBin)!;
                bin.totalGpa += gpa;
                bin.count++;
            }
        });
      }
    });

    return Array.from(creditBins.entries()).map(([creditLoad, { totalGpa, count }]) => ({
      creditLoad,
      avgGpa: totalGpa / count,
    })).sort((a, b) => a.creditLoad - b.creditLoad);
  }, [students]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Load vs. Average Semester Grade</CardTitle>
        <CardDescription>Average GPA for different credit loads.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={data} margin={{ top: 30, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="creditLoad" tickLine={false} axisLine={false} tickMargin={8}>
                    <Label value="Credit Load" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tickFormatter={(tick) => tick.toFixed(2)}>
                    <Label value="Average Semester GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="rect" />}
                />
                <Bar dataKey="avgGpa" fill="var(--color-avgGpa)" radius={4}>
                    <LabelList dataKey="avgGpa" position="top" formatter={(value: number) => value.toFixed(2)} />
                </Bar>
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
