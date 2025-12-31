"use client";

import * as React from "react";
import { Scatter, ScatterChart, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
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

export function HscVsCgpaChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    return students.map(s => ({
      hsc_gpa: s.hsc_gpa,
      cgpa: s.cgpa,
      performance: s.performance_group,
    }));
  }, [students]);
  
  const chartConfig = {
    cgpa: {
      label: "CGPA",
    },
    hsc_gpa: {
      label: "HSC GPA",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>HSC GPA vs. University CGPA</CardTitle>
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
            <XAxis type="number" dataKey="hsc_gpa" name="HSC GPA" unit="" domain={[1, 5]} />
            <YAxis type="number" dataKey="cgpa" name="CGPA" unit="" domain={[0, 4]}/>
            <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent indicator="dot" />} />
            <Scatter name="Students" data={chartData} fill="var(--color-hsc_gpa)" />
          </ScatterChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
