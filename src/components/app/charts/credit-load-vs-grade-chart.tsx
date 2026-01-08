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
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StudentWithCgpa } from '@/lib/types';

interface CreditLoadVsGradeChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  avgGpa: {
    label: "Average GPA",
    color: "hsl(30, 59%, 34%)",
  },
} satisfies ChartConfig;

export function CreditLoadVsGradeChart({ students }: CreditLoadVsGradeChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const creditBins = new Map<number, { totalGpa: number; count: number }>();

    students.forEach(student => {
      const creditBin = Math.round(student.avg_credit_load / 3) * 3;
      if (!creditBins.has(creditBin)) {
        creditBins.set(creditBin, { totalGpa: 0, count: 0 });
      }
      const bin = creditBins.get(creditBin)!;
      bin.totalGpa += student.cgpa;
      bin.count++;
    });

    return Array.from(creditBins.entries()).map(([credit, { totalGpa, count }]) => ({
      credit,
      avgGpa: totalGpa / count,
    })).sort((a, b) => a.credit - b.credit);
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Credit Load vs. Average Semester Grade</CardTitle>
        <CardDescription>Average GPA for different credit loads.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="credit" type="category">
                    <Label value="Credit Load" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tickFormatter={(tick) => tick.toFixed(2)}>
                    <Label value="Average Semester GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="avgGpa" fill="var(--color-avgGpa)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
