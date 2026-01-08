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

interface StudentAgeDistributionChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  count: {
    label: "Number of Students",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function StudentAgeDistributionChart({ students }: StudentAgeDistributionChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const currentYear = new Date().getFullYear();
    const ageBins = new Map<number, number>();

    students.forEach(student => {
      const age = currentYear - student.birth_year;
      if (!ageBins.has(age)) {
        ageBins.set(age, 0);
      }
      ageBins.set(age, ageBins.get(age)! + 1);
    });

    return Array.from(ageBins.entries()).map(([age, count]) => ({ age, count })).sort((a, b) => a.age - b.age);
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Student Age Distribution</CardTitle>
        <CardDescription>The age distribution of the students.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="age" domain={['dataMin - 1', 'dataMax + 1']}>
                    <Label value="Age" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis>
                    <Label value="Number of Students" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
