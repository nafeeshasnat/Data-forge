'use client';

import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StudentWithCgpa } from '@/lib/types';

interface PassingVsFailingRateChartProps {
  students: StudentWithCgpa[];
}

const chartConfig = {
  passing: {
    label: "Passing",
    color: "hsl(var(--chart-2))",
  },
  failing: {
    label: "Failing",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

export function PassingVsFailingRateChart({ students }: PassingVsFailingRateChartProps) {
  const data = useMemo(() => {
    if (!students) return [{ name: 'Passing', value: 0 }, { name: 'Failing', value: 0 }];
    const passingCount = students.filter(s => s.cgpa >= 2.0).length;
    const failingCount = students.length - passingCount;
    return [{ name: 'Passing', value: passingCount }, { name: 'Failing', value: failingCount }];
  }, [students]);

  return (
    <Card className='col-span-1'>
      <CardHeader>
        <CardTitle>Passing vs. Failing Rate</CardTitle>
        <CardDescription>A comparison of the number of students passing and failing.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
            <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" hideLabel />}
                />
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Passing' ? chartConfig.passing.color : chartConfig.failing.color} />
                    ))}
                </Pie>
            </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
