"use client";

import * as React from "react";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
import type { DataSummary } from "@/lib/types";
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

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function DepartmentDistributionChart({ summary }: { summary: DataSummary }) {
  const chartData = React.useMemo(() => {
    return Object.entries(summary.departmentDistribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [summary]);

  const chartConfig = React.useMemo(() => {
    const config: any = {};
    chartData.forEach((item, index) => {
        config[item.name] = {
            label: item.name,
            color: COLORS[index % COLORS.length]
        }
    });
    return config;
  }, [chartData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Department Distribution</CardTitle>
        <CardDescription>
          Shows the proportion of students in each department.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              strokeWidth={5}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartConfig[entry.name]?.color} />
              ))}
            </Pie>
            <Legend/>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
