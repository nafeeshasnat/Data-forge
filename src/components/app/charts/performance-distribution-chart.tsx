'use client';

import * as React from "react";
import { Pie, PieChart, Cell, Tooltip, Legend } from "recharts";
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

const COLORS = {
    High: "hsl(var(--chart-1))",
    Mid: "hsl(var(--chart-2))",
    Low: "hsl(var(--destructive))",
}

interface PerformanceDistributionChartProps {
    chartData: {
        name: string;
        value: number;
    }[];
}

export function PerformanceDistributionChart({ chartData }: PerformanceDistributionChartProps) {
 const chartConfig = React.useMemo(() => {
    const config: any = {};
    chartData.forEach((item) => {
        config[item.name] = {
            label: item.name.charAt(0).toUpperCase() + item.name.slice(1),
            color: COLORS[item.name as keyof typeof COLORS]
        }
    });
    return config;
  }, [chartData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Group Distribution</CardTitle>
        <CardDescription>
          Proportion of student performance profiles.
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
            <Legend />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
