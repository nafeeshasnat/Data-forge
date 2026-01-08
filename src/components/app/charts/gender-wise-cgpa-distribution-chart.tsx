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
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StudentWithCgpa } from '@/lib/types';

interface GenderWiseCgpaDistributionChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  male: {
    label: "Male",
    color: "hsl(var(--chart-4))",
  },
  female: {
    label: "Female",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function GenderWiseCgpaDistributionChart({ students }: GenderWiseCgpaDistributionChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const gpaBins = new Map<string, { male: number; female: number }>();

    students.forEach(student => {
        const gpaBinLabel = (Math.floor(student.cgpa * 4) / 4).toFixed(2);

        if (!gpaBins.has(gpaBinLabel)) {
            gpaBins.set(gpaBinLabel, { male: 0, female: 0 });
        }

        const bin = gpaBins.get(gpaBinLabel)!;
        if (student.gender === 'male') {
            bin.male++;
        } else {
            bin.female++;
        }
    });

    return Array.from(gpaBins.entries()).map(([gpa, counts]) => ({ gpa, ...counts })).sort((a, b) => parseFloat(a.gpa) - parseFloat(b.gpa));
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Gender-wise CGPA Distribution</CardTitle>
        <CardDescription>Distribution of CGPA for male and female students.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="gpa">
                    <Label value="CGPA" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis>
                    <Label value="Number of Students" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Bar dataKey="male" stackId="a" fill="var(--color-male)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" stackId="a" fill="var(--color-female)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
