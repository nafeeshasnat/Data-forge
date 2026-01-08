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
import type { StudentWithSemesterDetails } from '@/lib/types';

interface CreditLoadVsGradeChartProps {
  students: StudentWithSemesterDetails[];
}

const chartConfig = {
  avgGpa: {
    label: "Average GPA",
    color: "hsl(348, 57.60%, 48.00%)",
  },
} satisfies ChartConfig;

export function CreditLoadVsGradeChart({ students }: CreditLoadVsGradeChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const creditBins = new Map<number, { totalGpa: number; count: number }>();

    students.forEach(student => {
      if (student.semesterDetails) {
        student.semesterDetails.forEach(semester => {
            const creditBin = Math.round(semester.creditLoad / 3) * 3;
            if (!creditBins.has(creditBin)) {
                creditBins.set(creditBin, { totalGpa: 0, count: 0 });
            }
            const bin = creditBins.get(creditBin)!;
            bin.totalGpa += semester.gpa;
            bin.count++;
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
