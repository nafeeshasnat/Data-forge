"use client";

import * as React from "react";
import { Scatter, ScatterChart, XAxis, YAxis, Tooltip, CartesianGrid, Label } from "recharts";
import type { StudentWithCgpa } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";

function getPerformanceGroup(cgpa: number): 'high' | 'mid' | 'fail' {
    if (cgpa >= 3.5) return 'high';
    if (cgpa < 2.0) return 'fail';
    return 'mid';
}

export function HscVsCgpaChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    return students.map(s => ({
      preGradGpa: (s.ssc_gpa + s.hsc_gpa) / 2,
      ssc_gpa: s.ssc_gpa,
      hsc_gpa: s.hsc_gpa,
      cgpa: s.cgpa,
      performance: getPerformanceGroup(s.cgpa),
    }));
  }, [students]);
  
  const chartConfig = {
    cgpa: {
      label: "CGPA",
    },
    preGradGpa: {
      label: "Pre-Grad GPA",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pre-Grad GPA vs. University CGPA</CardTitle>
        <CardDescription>
          Shows the correlation between high school and university results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
          <ScatterChart
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid />
            <XAxis type="number" dataKey="preGradGpa" name="Pre-Grad GPA" unit="" domain={[2, 5]}>
                <Label value="Pre-Grad GPA" offset={-15} position="insideBottom" />
            </XAxis>
            <YAxis type="number" dataKey="cgpa" name="CGPA" unit="" domain={[0, 4]}>
                <Label value="CGPA" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip 
                cursor={{ strokeDasharray: '3 3' }} 
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                            <div className="bg-background border p-2 rounded-md shadow-lg">
                                <p><strong>CGPA:</strong> {data.cgpa.toFixed(2)}</p>
                                <p><strong>Pre-Grad GPA:</strong> {data.preGradGpa.toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">SSC: {data.ssc_gpa.toFixed(2)}, HSC: {data.hsc_gpa.toFixed(2)}</p>
                            </div>
                        );
                    }
                    return null;
                }}
            />
            <Scatter name="Students" data={chartData} fill="var(--color-preGradGpa)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
