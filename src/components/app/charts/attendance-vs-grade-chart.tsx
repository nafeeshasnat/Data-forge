'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Label,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StudentWithCgpa } from '@/lib/types';

interface AttendanceVsGradeChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  avgGpa: {
    label: "Average GPA",
    color: "hsl(266, 47.10%, 47.50%)",
  },
} satisfies ChartConfig;

export function AttendanceVsGradeChart({ students }: AttendanceVsGradeChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    const attendanceBins = new Map<number, { totalGpa: number; count: number }>();

    students.forEach(student => {
      const attendanceBin = Math.round(student.avg_attendance / 1) * 1;
      if (!attendanceBins.has(attendanceBin)) {
        attendanceBins.set(attendanceBin, { totalGpa: 0, count: 0 });
      }
      const bin = attendanceBins.get(attendanceBin)!;
      bin.totalGpa += student.cgpa;
      bin.count++;
    });

    return Array.from(attendanceBins.entries()).map(([attendance, { totalGpa, count }]) => ({
      attendance,
      avgGpa: totalGpa / count,
    })).sort((a, b) => a.attendance - b.attendance);
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Attendance vs. Average Semester Grade</CardTitle>
        <CardDescription>Average GPA for different attendance levels.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="attendance" domain={['dataMin - 10', 'dataMax + 10']}>
                    <Label value="Attendance Percentage" offset={-15} position="insideBottom" />
                </XAxis>
                <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} tickFormatter={(tick) => tick.toFixed(2)}>
                    <Label value="Average Semester GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
                </YAxis>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                />
                <Line type="monotone" dataKey="avgGpa" stroke="var(--color-avgGpa)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
            </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
