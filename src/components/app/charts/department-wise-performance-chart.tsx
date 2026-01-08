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

interface DepartmentWisePerformanceChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  avgGpa: {
    label: "Average GPA",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function DepartmentWisePerformanceChart({ students }: DepartmentWisePerformanceChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const departmentData = new Map<string, { totalGpa: number; count: number }>();

    students.forEach(student => {
      if (!departmentData.has(student.department)) {
        departmentData.set(student.department, { totalGpa: 0, count: 0 });
      }
      const dept = departmentData.get(student.department)!;
      dept.totalGpa += student.cgpa;
      dept.count++;
    });

    return Array.from(departmentData.entries()).map(([department, { totalGpa, count }]) => ({
      department,
      avgGpa: totalGpa / count,
    }));
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Department-wise Performance</CardTitle>
        <CardDescription>Average GPA for each department.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <BarChart data={data} margin={{ top: 20, right: 30, bottom: 40, left: 40 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 4]} tickFormatter={(tick) => tick.toFixed(1)}>
                    <Label value="Average GPA" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis type="category" dataKey="department" width={80} />
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
