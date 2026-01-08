'use client';

import * as React from 'react';
import { Bubble, BubbleChart, XAxis, YAxis, Tooltip, CartesianGrid, Label, ResponsiveContainer, ZAxis } from 'recharts';
import type { AnalysisSummary } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartTooltipContent,
} from "@/components/ui/chart";

export function HscVsCgpaDensityChart({ summary }: { summary: AnalysisSummary }) {
  const chartData = React.useMemo(() => {
    if (!summary || !summary.hscVsCgpaDensity) return [];
    return summary.hscVsCgpaDensity;
  }, [summary]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BubbleChart
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" dataKey="hscGpa" name="Pre-Grad GPA" domain={['dataMin - 0.1', 'dataMax + 0.1']} tickFormatter={(tick) => tick.toFixed(2)}>
            <Label value="Pre-Grad GPA" offset={-15} position="insideBottom" />
        </XAxis>
        <YAxis type="number" dataKey="cgpa" name="CGPA" domain={[0, 4]} tickFormatter={(tick) => tick.toFixed(2)}>
            <Label value="CGPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
        </YAxis>
        <ZAxis type="number" dataKey="count" name="Student Count" range={[100, 1000]} />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          content={
            <ChartTooltipContent
                labelFormatter={(value, payload) => {
                    if (payload && payload.length) {
                        return `HSC GPA: ${payload[0].payload.hscGpa}, CGPA: ${payload[0].payload.cgpa}`
                    }
                    return String(value);
                }}
            />
          }
        />
        <Bubble dataKey="count" name="Student Count" data={chartData} fill="hsl(var(--chart-1))" />
      </BubbleChart>
    </ResponsiveContainer>
  );
}
