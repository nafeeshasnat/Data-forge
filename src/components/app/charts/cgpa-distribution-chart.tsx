'use client';

import * as React from "react";
import { Line, LineChart, XAxis, YAxis, Tooltip, CartesianGrid, Label, ResponsiveContainer } from "recharts";
import type { StudentWithCgpa, CgpaDistribution } from "@/lib/types";
import { getCgpaDistributionData } from "@/lib/chart-data-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const binSize = 0.1;
    const binStart = Math.max(0, Number((label - binSize / 2).toFixed(2)));
    const binEnd = Number((label + binSize / 2).toFixed(2));
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <p className="text-sm font-bold">CGPA Range: {binStart} - {binEnd}</p>
        <p className="text-sm text-muted-foreground">Students: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

interface CgpaDistributionChartProps {
    students?: StudentWithCgpa[];
    data?: CgpaDistribution[];
}

export function CgpaDistributionChart({ students, data }: CgpaDistributionChartProps) {
  const chartData = React.useMemo(() => {
    if (data) {
        return data;
    }
    if (students) {
        return getCgpaDistributionData(students);
    }
    return [];
  }, [students, data]);

  React.useEffect(() => {
    console.log("[CgpaDistributionChart] chartData", chartData);
  }, [chartData]);

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
