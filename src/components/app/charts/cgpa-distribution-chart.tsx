"use client";

import * as React from "react";
import { Bar, BarChart, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
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

export function CgpaDistributionChart({ students }: { students: StudentWithCgpa[] }) {
  const chartData = React.useMemo(() => {
    const bins: Record<string, number> = {
        "0.0-1.0": 0, "1.0-1.5": 0, "1.5-2.0": 0, "2.0-2.5": 0, "2.5-3.0": 0, "3.0-3.5": 0, "3.5-4.0": 0,
    };

    students.forEach(student => {
      const cgpa = student.cgpa;
      if (cgpa <= 1.0) bins["0.0-1.0"]++;
      else if (cgpa <= 1.5) bins["1.0-1.5"]++;
      else if (cgpa <= 2.0) bins["1.5-2.0"]++;
      else if (cgpa <= 2.5) bins["2.0-2.5"]++;
      else if (cgpa <= 3.0) bins["2.5-3.0"]++;
      else if (cgpa <= 3.5) bins["3.0-3.5"]++;
      else bins["3.5-4.0"]++;
    });

    return Object.entries(bins).map(([name, count]) => ({ name, count }));
  }, [students]);

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CGPA Distribution</CardTitle>
        <CardDescription>
          Number of students in different CGPA ranges.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[250px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
