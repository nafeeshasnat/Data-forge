'use client';

import { useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
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

interface HscVsCgpaChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  cgpa: {
    label: "CGPA",
    color: "hsl(195, 74%, 65%)",
  },
} satisfies ChartConfig;

export function HscVsCgpaChart({ students }: HscVsCgpaChartProps) {
  const data = useMemo(() => {
    if (!students) return [];
    return students.map(student => ({
      hscGpa: student.hsc_gpa,
      cgpa: student.cgpa,
    }));
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>HSC GPA vs. University CGPA</CardTitle>
        <CardDescription>A scatter plot showing the correlation between HSC GPA and university CGPA.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <YAxis type="number" dataKey="hscGpa" domain={[2, 5]} tickFormatter={(tick) => tick.toFixed(1)}>
              <Label value="HSC GPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <XAxis type="number" dataKey="cgpa" domain={[0, 4]} tickFormatter={(tick) => tick.toFixed(1)}>
              <Label value="University CGPA" offset={-15} position="insideBottom" />
            </XAxis>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Scatter data={data} fill="var(--color-cgpa)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
