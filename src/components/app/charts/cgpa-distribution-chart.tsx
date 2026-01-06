'use client';

import * as React from "react";
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import type { StudentWithCgpa } from "@/lib/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const binSize = 0.2;
        const binStart = Math.max(0, label - binSize / 2).toFixed(2);
        const binEnd = Math.min(4, label + binSize / 2).toFixed(2);
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="text-sm font-bold">CGPA Range: {binStart} - {binEnd}</p>
                <p className="text-sm text-muted-foreground">Students: {payload[0].value}</p>
            </div>
        );
    }
    return null;
};

export function CgpaDistributionChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    if (!students || students.length === 0) {
      return [];
    }

    const bins: Record<string, number> = {};
    const binSize = 0.2;

    students.forEach(student => {
      // Adjust CGPA of 4.0 to fall into the last bin
      const adjustedCgpa = student.cgpa >= 4.0 ? 3.99 : student.cgpa;
      const bin = Math.floor(adjustedCgpa / binSize) * binSize;
      const binKey = bin.toFixed(2);
      if (!bins[binKey]) {
        bins[binKey] = 0;
      }
      bins[binKey]++;
    });

    const data = [];
    // The loop should not include 4.0 as it's the upper bound.
    for (let i = 0; i < 4.0; i += binSize) {
      const binKey = i.toFixed(2);
      data.push({
        cgpa: i + binSize / 2,
        students: bins[binKey] || 0,
      });
    }
    return data;
  }, [students]);

  const chartConfig = {
    students: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CGPA Distribution</CardTitle>
        <CardDescription>
          Distribution of student CGPA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid vertical={false} />
            <XAxis 
                dataKey="cgpa" 
                type="number" 
                domain={[0, 4]} 
                tickLine={false} 
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => value.toFixed(1)}
            >
                <Label value="CGPA" offset={-15} position="insideBottom" />
            </XAxis>
            <YAxis 
                dataKey="students"
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
            >
                 <Label value="Number of Students" angle={-90} position="insideLeft" style={{ textAnchor: 'middle' }} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Line 
                dataKey="students" 
                type="monotone" 
                stroke={chartConfig.students.color}
                strokeWidth={2}
                dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
