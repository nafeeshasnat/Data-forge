'use client';

import * as React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, Label, ResponsiveContainer, ZAxis } from 'recharts';
import type { HscVsCgpaDensityData } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig = {
  students: {
    label: "Students",
    color: "hsl(var(--chart-1))",
  },
};

export function HscVsCgpaDensityChart({ data }: { data: HscVsCgpaDensityData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Grad GPA vs. University CGPA (Density)</CardTitle>
        <CardDescription>
          Shows the correlation between high school and university results, with bubble size representing the density of students.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ScatterChart
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="preGpa" name="Pre-Grad GPA" domain={[2, 5]} tickFormatter={(tick) => tick.toFixed(1)}>
                <Label value="Pre-Graduation GPA" offset={-15} position="insideBottom" />
            </XAxis>
            <YAxis type="number" dataKey="uniCgpa" name="University CGPA" domain={[0, 4]} tickFormatter={(tick) => tick.toFixed(1)}>
                <Label value="University CGPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <ZAxis type="number" dataKey="z" name="Student Count" range={[100, 1000]} />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                    indicator="dot"
                    labelFormatter={(value, payload) => {
                        if (payload && payload.length) {
                            return `Pre-Grad GPA: ${payload[0].payload.preGpa.toFixed(2)}, Uni CGPA: ${payload[0].payload.uniCgpa.toFixed(2)}`
                        }
                        return String(value);
                    }}
                />
              }
            />
            <Scatter name="Student Density" data={data} fill="var(--color-students)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
